/**
 * OSA Phenotyper – clinician-only patient API (Lambda handler)
 * Every route requires both the CloudFront origin secret and a Cognito JWT.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminListGroupsForUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  DynamoDBDocumentClient, GetCommand, PutCommand,
  UpdateCommand, QueryCommand
} from '@aws-sdk/lib-dynamodb';
import { randomUUID, randomBytes, createHash } from 'node:crypto';

const TABLE = process.env.TABLE_NAME;
const TOKEN_TABLE = process.env.TOKEN_TABLE;
const ORIGIN_VERIFY_SECRET = process.env.ORIGIN_VERIFY_SECRET || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const ADMIN_GROUP_NAME = process.env.ADMIN_GROUP_NAME || 'osa-admin';
const CLINICIAN_GROUP_NAME = process.env.CLINICIAN_GROUP_NAME || 'osa-clinician';
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const REPORT_SNAPSHOT_LIMIT = 5;
const VISIT_FIELD_PREVIEW_LIMIT = 12;
const FIELD_PROVENANCE_HISTORY_LIMIT = 12;
const INTAKE_REVIEW_HISTORY_LIMIT = 20;
const INTAKE_REVIEW_FIELD_PREVIEW_LIMIT = 20;
const FOLLOWUP_LIMIT = 20;
const ALLOWED_INTAKE_REVIEW_ACTIONS = new Set(['accept-intake', 'keep-chart']);
const FOLLOWUP_TREATMENTS = new Set(['PAP', 'Oral appliance', 'Weight / GLP-1', 'Positional therapy', 'Nasal treatment', 'Airway surgery', 'Hypoglossal stimulation', 'CBT-I', 'Observation / other']);
const FOLLOWUP_STATUSES = new Set(['Planned', 'Started', 'Active', 'Paused', 'Completed']);
const FOLLOWUP_RESPONSES = new Set(['Better', 'No meaningful change', 'Worse', 'Not assessed']);
const FOLLOWUP_ADHERENCE = new Set(['Using as planned', 'Partial use', 'Not using', 'Not applicable']);
const FOLLOWUP_NEXT_ACTIONS = new Set(['Continue current plan', 'Optimize current treatment', 'Reassess barriers', 'Repeat sleep study', 'Change treatment pathway', 'Schedule procedure', 'Refer / coordinate care', 'No action documented']);
const INTAKE_TOKEN_LIFETIME_SECONDS = 72 * 60 * 60;
const TOKEN_TTL_GRACE_SECONDS = 30 * 24 * 60 * 60;
const QUESTIONNAIRE_TOKEN_TYPES = new Set(['intake', 'followup']);
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = USER_POOL_ID ? new CognitoIdentityProviderClient({}) : null;

function getAllowedOrigin(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : '';
}

function buildHeaders(event) {
  const allowedOrigin = getAllowedOrigin(event);
  return {
    'Content-Type': 'application/json',
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin, 'Vary': 'Origin' } : {}),
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Referrer-Policy': 'no-referrer',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
  };
}

const ok = (event, body, code = 200) => ({
  statusCode: code,
  headers: buildHeaders(event),
  body: JSON.stringify(body),
});

const fail = (event, msg, code = 400) => ({
  statusCode: code,
  headers: buildHeaders(event),
  body: JSON.stringify({ error: msg }),
});

function isEmptyLike(val) {
  return val === null || val === undefined || val === '' || val === false || val === 'false';
}

function canonicalFormValue(val) {
  if (val === true || val === 'on' || val === 'true') return 'bool:true';
  if (isEmptyLike(val)) return 'bool:false';
  if (typeof val === 'number') return `num:${val}`;
  if (typeof val === 'string' && /^-?\d+(\.\d+)?$/.test(val.trim())) return `num:${Number(val.trim())}`;
  return `str:${String(val).trim()}`;
}

function formValuesEqual(a, b) {
  return canonicalFormValue(a) === canonicalFormValue(b);
}

function needsLvefFollowup(formData) {
  const heartFailure = formData?.cvdHeartFailure === true || formData?.cvdHeartFailure === 'on' || formData?.cvdHeartFailure === 'true';
  const priorEcho = String(formData?.echoHistory || '').toLowerCase() === 'yes';
  const lvef = Number(formData?.lvef);
  return (heartFailure || priorEcho) && (!Number.isFinite(lvef) || lvef < 5 || lvef > 90);
}

function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function updateFieldProvenance(existing, fields, source, user, timestamp) {
  const provenance = (existing && typeof existing === 'object' && !Array.isArray(existing))
    ? { ...existing }
    : {};

  if (!Array.isArray(fields) || !fields.length) {
    return provenance;
  }

  fields.forEach((field) => {
    provenance[field] = {
      source,
      updatedAt: timestamp,
      updatedBy: user,
    };
  });

  return provenance;
}

function appendFieldProvenanceHistoryEntry(existingHistory, field, entry) {
  const nextHistory = (existingHistory && typeof existingHistory === 'object' && !Array.isArray(existingHistory))
    ? cloneJson(existingHistory)
    : {};

  const entries = Array.isArray(nextHistory[field]) ? nextHistory[field].slice() : [];
  entries.push(entry);
  nextHistory[field] = entries.slice(-FIELD_PROVENANCE_HISTORY_LIMIT);
  return nextHistory;
}

function appendFieldProvenanceHistory(existingHistory, fields, source, user, timestamp, valueSource, extraFactory = null) {
  let nextHistory = (existingHistory && typeof existingHistory === 'object' && !Array.isArray(existingHistory))
    ? cloneJson(existingHistory)
    : {};

  if (!Array.isArray(fields) || !fields.length) {
    return nextHistory;
  }

  fields.forEach((field) => {
    const value = valueSource && typeof valueSource === 'object'
      ? cloneJson(valueSource[field])
      : undefined;
    const extra = typeof extraFactory === 'function' ? (extraFactory(field) || {}) : {};
    nextHistory = appendFieldProvenanceHistoryEntry(nextHistory, field, {
      source,
      updatedAt: timestamp,
      updatedBy: user,
      value,
      ...extra,
    });
  });

  return nextHistory;
}

function appendIntakeReviewHistory(existingHistory, reviewEntry) {
  const history = Array.isArray(existingHistory) ? cloneJson(existingHistory) : [];
  history.push(reviewEntry);
  return history.slice(-INTAKE_REVIEW_HISTORY_LIMIT);
}

function sanitizeIntakeReview(rawReview, currentPendingOverrides) {
  const pendingOverrides = (currentPendingOverrides && typeof currentPendingOverrides === 'object' && !Array.isArray(currentPendingOverrides))
    ? currentPendingOverrides
    : {};
  const review = (rawReview && typeof rawReview === 'object' && !Array.isArray(rawReview))
    ? rawReview
    : {};
  const note = typeof review.note === 'string' ? review.note.trim().slice(0, 1000) : '';
  const rawResolutions = Array.isArray(review.resolutions) ? review.resolutions : [];
  const seen = new Set();
  const resolutions = [];

  rawResolutions.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const field = String(item.field || '').trim();
    const action = String(item.action || '').trim();
    if (!field || seen.has(field) || !Object.prototype.hasOwnProperty.call(pendingOverrides, field)) return;
    if (!ALLOWED_INTAKE_REVIEW_ACTIONS.has(action)) return;
    seen.add(field);
    resolutions.push({ field, action });
  });

  return { note, resolutions };
}

function sanitizeOptionalNumber(value, min, max, { integer = false } = {}) {
  if (value === null || value === undefined || value === '') return { value: null };
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
    return { error: true };
  }
  return { value: parsed };
}

function sanitizeFollowupEntry(rawEntry, user, timestamp) {
  const raw = (rawEntry && typeof rawEntry === 'object' && !Array.isArray(rawEntry)) ? rawEntry : {};
  const date = String(raw.date || '').trim();
  const treatment = String(raw.treatment || '').trim();
  const status = String(raw.status || '').trim();
  const response = String(raw.response || '').trim();
  const adherence = String(raw.adherence || '').trim();
  const nextAction = String(raw.nextAction || '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00Z`))) return null;
  if (!FOLLOWUP_TREATMENTS.has(treatment) || !FOLLOWUP_STATUSES.has(status)) return null;
  if (!FOLLOWUP_RESPONSES.has(response) || !FOLLOWUP_ADHERENCE.has(adherence) || !FOLLOWUP_NEXT_ACTIONS.has(nextAction)) return null;

  const weight = sanitizeOptionalNumber(raw.weight, 50, 700);
  const ess = sanitizeOptionalNumber(raw.ess, 0, 24, { integer: true });
  const isi = sanitizeOptionalNumber(raw.isi, 0, 28, { integer: true });
  const ahi = sanitizeOptionalNumber(raw.ahi, 0, 200);
  if (weight.error || ess.error || isi.error || ahi.error) return null;

  return {
    followupId: randomUUID(),
    date,
    treatment,
    status,
    response,
    adherence,
    nextAction,
    ...(weight.value !== null ? { weight: weight.value } : {}),
    ...(ess.value !== null ? { ess: ess.value } : {}),
    ...(isi.value !== null ? { isi: isi.value } : {}),
    ...(ahi.value !== null ? { ahi: ahi.value } : {}),
    recordedAt: timestamp,
    recordedBy: user,
    schemaVersion: 1,
  };
}

function filterPendingMetadata(existing, pendingKeys) {
  const next = {};
  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) return next;
  pendingKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(existing, key)) {
      next[key] = existing[key];
    }
  });
  return next;
}

function buildReportSnapshots(existingSnapshots, payload, user, timestamp) {
  if (!payload || typeof payload !== 'object') return existingSnapshots || [];

  const patientReportHtml = typeof payload.patientReportHtml === 'string'
    ? payload.patientReportHtml.trim()
    : '';
  if (!patientReportHtml) return existingSnapshots || [];

  const analysisData = cloneJson(payload.analysisData || {});
  const analysisJson = JSON.stringify(analysisData);
  const stage = analysisData.primaryAHI === null || analysisData.primaryAHI === undefined
    ? 'pre-study'
    : 'post-study';

  const snapshot = {
    snapshotId: randomUUID(),
    createdAt: timestamp,
    createdBy: user,
    reportDate: payload.reportDate || timestamp.split('T')[0],
    patientName: String(payload.patientName || '').trim(),
    stage,
    severity: analysisData.severity || null,
    primaryAHI: analysisData.primaryAHI ?? null,
    phenotypes: Array.isArray(analysisData.phen) ? analysisData.phen.slice(0, 20) : [],
    recTags: Array.isArray(analysisData.recTags) ? analysisData.recTags.map(rec => rec.tag).filter(Boolean).slice(0, 30) : [],
    analysisData,
    analysisHash: createHash('sha256').update(analysisJson).digest('hex'),
    patientReportHtml,
    patientReportHash: createHash('sha256').update(patientReportHtml).digest('hex'),
    schemaVersion: 1,
  };

  const snapshots = Array.isArray(existingSnapshots) ? existingSnapshots.slice() : [];
  snapshots.push(snapshot);
  return snapshots.slice(-REPORT_SNAPSHOT_LIMIT);
}

function getMeaningfulChangedFields(previousFormData, nextFormData) {
  const previous = (previousFormData && typeof previousFormData === 'object' && !Array.isArray(previousFormData))
    ? previousFormData
    : {};
  const next = (nextFormData && typeof nextFormData === 'object' && !Array.isArray(nextFormData))
    ? nextFormData
    : {};
  const keys = Array.from(new Set([...Object.keys(previous), ...Object.keys(next)]));

  return keys.filter((key) => {
    const prev = previous[key];
    const curr = next[key];
    if (isEmptyLike(prev) && isEmptyLike(curr)) return false;
    return !formValuesEqual(prev, curr);
  });
}

function buildVisitEntry({
  action,
  user,
  timestamp,
  previousFormData,
  nextFormData,
  changedRecordFields = [],
  reportSnapshotSaved = false,
}) {
  const visit = {
    date: timestamp,
    user,
    action,
  };

  const changedFields = getMeaningfulChangedFields(previousFormData, nextFormData);
  if (changedFields.length) {
    visit.changedFieldCount = changedFields.length;
    visit.changedFields = changedFields.slice(0, VISIT_FIELD_PREVIEW_LIMIT);
    if (changedFields.length > VISIT_FIELD_PREVIEW_LIMIT) {
      visit.changedFieldsTruncated = true;
    }
  }

  const meaningfulNextValues = Object.entries(
    (nextFormData && typeof nextFormData === 'object' && !Array.isArray(nextFormData)) ? nextFormData : {}
  ).filter(([, value]) => !isEmptyLike(value));
  if (action === 'Created') {
    visit.initialFieldCount = meaningfulNextValues.length;
  }

  if (changedRecordFields.length) {
    visit.changedRecordFieldCount = changedRecordFields.length;
    visit.changedRecordFields = changedRecordFields.slice(0, VISIT_FIELD_PREVIEW_LIMIT);
    if (changedRecordFields.length > VISIT_FIELD_PREVIEW_LIMIT) {
      visit.changedRecordFieldsTruncated = true;
    }
  }

  if (reportSnapshotSaved) {
    visit.reportSnapshotSaved = true;
  }

  return visit;
}

function normalizeNameForSearch(name) {
  return String(name || '')
    .trim()
    .toLowerCase();
}

function buildNameSearchBucket(name) {
  const normalized = normalizeNameForSearch(name);
  const firstSearchChar = normalized.match(/[a-z0-9]/)?.[0];
  return firstSearchChar || '#';
}

function extractGivenNameForSearch(name) {
  const normalized = normalizeNameForSearch(name);
  if (!normalized) return '';
  if (normalized.includes(',')) return normalized.split(',').slice(1).join(' ').trim() || normalized;
  return normalized.split(/\s+/)[0] || '';
}

function buildGivenNameSearchBucket(name) {
  return buildNameSearchBucket(extractGivenNameForSearch(name));
}

const WORKFLOW_MILESTONES = [
  'Initial Eval',
  'Study Ordered',
  'Study Reviewed',
  'Treatment Plan',
  'CPAP Trial',
  'CPAP Follow-up',
  'DISE Scheduled',
  'DISE Completed',
  'Surgery Scheduled',
  'Post-Op',
  'MAD Referred',
  'MAD Follow-up',
  'New Sleep Study',
  'Efficacy Study',
];

function normalizeMilestones(milestones, fallbackStatus = 'Initial Eval') {
  const rawMilestones = Array.isArray(milestones) ? milestones.filter(Boolean) : [];
  const uniqueMilestones = Array.from(new Set(rawMilestones));
  const orderedKnownMilestones = WORKFLOW_MILESTONES.filter(step => uniqueMilestones.includes(step));
  const unknownMilestones = uniqueMilestones.filter(step => !WORKFLOW_MILESTONES.includes(step));
  const normalizedMilestones = [...orderedKnownMilestones, ...unknownMilestones];

  if (normalizedMilestones.length) {
    return normalizedMilestones;
  }

  return fallbackStatus ? [fallbackStatus] : [];
}

function derivePatientStatus(milestones, fallbackStatus = 'Initial Eval') {
  const normalizedMilestones = normalizeMilestones(milestones, fallbackStatus);
  return normalizedMilestones.length
    ? normalizedMilestones[normalizedMilestones.length - 1]
    : (fallbackStatus || 'Initial Eval');
}

function parseUserGroups(rawGroups) {
  if (!rawGroups) return [];
  const normalizeGroupName = (group) => String(group)
    .trim()
    .replace(/^[\[\]"'\s]+|[\[\]"'\s]+$/g, '')
    .trim();

  if (Array.isArray(rawGroups)) return rawGroups.map(normalizeGroupName).filter(Boolean);
  const normalized = String(rawGroups).trim();
  if (!normalized) return [];
  if (normalized.startsWith('[')) {
    try {
      const parsed = JSON.parse(normalized);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeGroupName).filter(Boolean);
      }
    } catch {
      // Fall back to comma-delimited parsing below.
    }
  }
  return normalized
    .split(',')
    .map(normalizeGroupName)
    .filter(Boolean);
}

async function getUserGroups(event) {
  const claims = event?.requestContext?.authorizer?.jwt?.claims || {};
  const claimGroups = parseUserGroups(claims['cognito:groups']);
  if (claimGroups.length || !USER_POOL_ID || !cognito) return claimGroups;

  const username = claims['cognito:username'] || claims.username || claims.sub;
  if (!username) return [];

  try {
    const response = await cognito.send(new AdminListGroupsForUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: String(username),
    }));
    return (response.Groups || [])
      .map(group => String(group.GroupName || '').trim())
      .filter(Boolean);
  } catch (err) {
    console.log(JSON.stringify({
      event: 'group_lookup_failed',
      errorType: err?.name || 'unknown',
    }));
    return [];
  }
}

function hasRequiredGroup(userGroups, allowedGroups) {
  return allowedGroups.some(group => userGroups.includes(group));
}

/* ── Route dispatcher ─────────────────────────────────────── */
export async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.requestContext?.http?.path || event.path;
  const user = event.requestContext?.authorizer?.jwt?.claims?.email || 'unknown';

  try {
    const suppliedOriginSecret = event?.headers?.['x-origin-verify'] || event?.headers?.['X-Origin-Verify'] || '';
    if (!ORIGIN_VERIFY_SECRET || suppliedOriginSecret !== ORIGIN_VERIFY_SECRET) {
      return fail(event, 'Forbidden', 403);
    }

    const userGroups = await getUserGroups(event);

    if (method === 'OPTIONS') {
      return ok(event, {});
    }

    if (method === 'POST' && path === '/intake-tokens') {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME, CLINICIAN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      return await createIntakeToken(event, JSON.parse(event.body || '{}'), user);
    }
    if (method === 'GET' && path.match(/^\/intake-tokens\/[^/]+$/)) {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME, CLINICIAN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      return await listIntakeTokens(event, path.split('/').pop());
    }
    if (method === 'DELETE' && path.match(/^\/intake-tokens\/[^/]+$/)) {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME, CLINICIAN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      return await revokeIntakeToken(event, path.split('/').pop(), user);
    }

    // GET /patients/search?q=...
    if (method === 'GET' && path === '/patients/search') {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME, CLINICIAN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      return await searchPatients(event, event.queryStringParameters, userGroups, user);
    }
    // GET /patients/:id
    if (method === 'GET' && path.match(/^\/patients\/[^/]+$/)) {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME, CLINICIAN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      const id = path.split('/').pop();
      return await getPatient(event, id, user);
    }
    // POST /patients
    if (method === 'POST' && path === '/patients') {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME, CLINICIAN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      const body = JSON.parse(event.body || '{}');
      return await createPatient(event, body, user);
    }
    // PUT /patients/:id
    if (method === 'PUT' && path.match(/^\/patients\/[^/]+$/)) {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME, CLINICIAN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      const id = path.split('/').pop();
      const body = JSON.parse(event.body || '{}');
      return await updatePatient(event, id, body, user, userGroups);
    }
    // DELETE /patients/:id
    if (method === 'DELETE' && path.match(/^\/patients\/[^/]+$/)) {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      const id = path.split('/').pop();
      return await deletePatient(event, id, user);
    }

    return fail(event, 'Not found', 404);
  } catch (err) {
    // Log error type only — never log full error object (may contain PHI in stack/message)
    console.log(JSON.stringify({
      action: 'lambda_error',
      errorType: err.name || 'Error',
      timestamp: new Date().toISOString(),
    }));
    return fail(event, 'Internal server error', 500);
  }
}

/* ── Patient intake token management ──────────────────────── */

function extractPatientFirstName(fullName) {
  const trimmed = String(fullName || '').trim();
  if (!trimmed) return 'Patient';
  if (trimmed.includes(',')) return trimmed.split(',').pop().trim().split(/\s+/)[0] || 'Patient';
  return trimmed.split(/\s+/)[0] || 'Patient';
}

async function createIntakeToken(event, body, user) {
  const patientId = body?.patientId;
  if (!patientId) return fail(event, 'patientId is required');
  const questionnaireType = String(body?.questionnaireType || 'intake').trim().toLowerCase();
  if (!QUESTIONNAIRE_TOKEN_TYPES.has(questionnaireType)) return fail(event, 'Invalid questionnaire type');

  const { Item: patient } = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { patientId },
    ProjectionExpression: '#n, isDeleted',
    ExpressionAttributeNames: { '#n': 'name' },
  }));
  if (!patient || patient.isDeleted) return fail(event, 'Patient not found', 404);

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const now = new Date();
  const expiresAt = Math.floor(now.getTime() / 1000) + INTAKE_TOKEN_LIFETIME_SECONDS;

  await ddb.send(new PutCommand({
    TableName: TOKEN_TABLE,
    Item: {
      tokenHash,
      patientId,
      tokenType: questionnaireType,
      expiresAt,
      ttl: expiresAt + TOKEN_TTL_GRACE_SECONDS,
      status: 'active',
      createdAt: now.toISOString(),
      createdBy: user,
      attempts: 0,
      patientFirstName: extractPatientFirstName(patient.name),
    },
  }));

  console.log(JSON.stringify({ action: 'questionnaire_token_created', questionnaireType, patientId, createdBy: user, timestamp: now.toISOString() }));
  return ok(event, { token: rawToken, questionnaireType, expiresAt: new Date(expiresAt * 1000).toISOString() }, 201);
}

async function listIntakeTokens(event, patientId) {
  const { Items } = await ddb.send(new QueryCommand({
    TableName: TOKEN_TABLE,
    IndexName: 'patient-index',
    KeyConditionExpression: 'patientId = :patientId',
    ExpressionAttributeValues: { ':patientId': patientId },
    ProjectionExpression: 'tokenHash, #s, expiresAt, createdAt, createdBy, usedAt, tokenType',
    ExpressionAttributeNames: { '#s': 'status' },
  }));
  const now = Math.floor(Date.now() / 1000);
  const tokens = (Items || [])
    .filter(item => !item.tokenType || QUESTIONNAIRE_TOKEN_TYPES.has(item.tokenType))
    .map(item => ({
      tokenHash: item.tokenHash,
      questionnaireType: item.tokenType || 'intake',
      status: item.status === 'active' && item.expiresAt <= now ? 'expired' : item.status,
      expiresAt: new Date(item.expiresAt * 1000).toISOString(),
      createdAt: item.createdAt,
      createdBy: item.createdBy,
      usedAt: item.usedAt || null,
    }))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return ok(event, tokens);
}

async function revokeIntakeToken(event, tokenHash, user) {
  try {
    await ddb.send(new UpdateCommand({
      TableName: TOKEN_TABLE,
      Key: { tokenHash },
      UpdateExpression: 'SET #s = :revoked, revokedAt = :now, revokedBy = :user',
      ConditionExpression: '#s = :active',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':revoked': 'revoked', ':active': 'active',
        ':now': new Date().toISOString(), ':user': user,
      },
    }));
    console.log(JSON.stringify({ action: 'intake_token_revoked', revokedBy: user, timestamp: new Date().toISOString() }));
    return ok(event, { revoked: true });
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') return fail(event, 'Token is not active or does not exist', 404);
    throw err;
  }
}

/* ── CRUD operations ──────────────────────────────────────── */

async function createPatient(event, body, user) {
  const { name, dob, mrn, formData, status, milestones } = body;
  if (!name || !dob) return fail(event, 'Name and DOB are required');

  const now = new Date().toISOString();
  const normalizedMilestones = normalizeMilestones(milestones, status || 'Initial Eval');
  const normalizedFormData = formData || {};
  const initialFormFields = Object.keys(normalizedFormData);
  const initialIdentityValues = {
    name: name.trim(),
    dob,
    mrn: (mrn || '').trim(),
  };
  const initialProvenanceFields = [...new Set([
    ...initialFormFields,
    'name',
    'dob',
    ...((mrn || '').trim() ? ['mrn'] : []),
  ])];
  const item = {
    patientId: randomUUID(),
    name: initialIdentityValues.name,
    nameLower: normalizeNameForSearch(name),
    nameSearchBucket: buildNameSearchBucket(name),
    givenNameLower: extractGivenNameForSearch(name),
    givenNameSearchBucket: buildGivenNameSearchBucket(name),
    dob,
    // Omit mrn entirely when blank — `mrn` is the mrn-index GSI partition key, and
    // DynamoDB rejects empty-string key attributes. Leaving it out keeps the index sparse.
    ...(initialIdentityValues.mrn ? { mrn: initialIdentityValues.mrn } : {}),
    status: derivePatientStatus(normalizedMilestones, status || 'Initial Eval'),
    milestones: normalizedMilestones,
    formData: normalizedFormData,
    lvefFollowupNeeded: needsLvefFollowup(normalizedFormData),
    fieldProvenance: updateFieldProvenance({}, initialProvenanceFields, 'clinician', user, now),
    fieldProvenanceHistory: appendFieldProvenanceHistory({}, initialProvenanceFields, 'clinician', user, now, {
      ...normalizedFormData,
      ...initialIdentityValues,
    }, () => ({
      event: 'created',
    })),
    visits: [buildVisitEntry({
      action: 'Created',
      user,
      timestamp: now,
      previousFormData: {},
      nextFormData: normalizedFormData,
      changedRecordFields: ['name', 'dob', ...((mrn || '').trim() ? ['mrn'] : [])],
    })],
    createdAt: now,
    updatedAt: now,
    createdBy: user,
    updatedBy: user,
    version: 1,
  };

  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return ok(event, item, 201);
}

async function getPatient(event, id, user) {
  const { Item } = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { patientId: id },
  }));
  if (!Item || Item.isDeleted) return fail(event, 'Patient not found', 404);
  console.log(JSON.stringify({
    action: 'patient_record_viewed',
    patientId: id,
    viewedBy: user,
    timestamp: new Date().toISOString(),
  }));
  return ok(event, Item);
}

async function updatePatient(event, id, body, user, userGroups) {
  // Verify patient exists
  const { Item } = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { patientId: id },
  }));
  if (!Item) return fail(event, 'Patient not found', 404);
  const isRestore = body.restore === true;
  if (Item.isDeleted && !isRestore) return fail(event, 'Patient not found', 404);
  if (isRestore && !hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME])) return fail(event, 'Forbidden', 403);

  if (isRestore) {
    const now = new Date().toISOString();
    const restoredStatus = derivePatientStatus(Item.milestones, 'Initial Eval');
    const visit = [{
      date: now,
      user,
      action: 'Restored',
    }];

    let Attributes;
    try {
      ({ Attributes } = await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { patientId: id },
        UpdateExpression: 'SET #u = :now, #ub = :user, #s = :status, #visits = list_append(if_not_exists(#visits, :emptyList), :visit) REMOVE isDeleted, deletedAt, deletedBy',
        ConditionExpression: 'attribute_exists(patientId) AND isDeleted = :true',
        ExpressionAttributeNames: {
          '#u': 'updatedAt',
          '#ub': 'updatedBy',
          '#s': 'status',
          '#visits': 'visits',
        },
        ExpressionAttributeValues: {
          ':true': true,
          ':now': now,
          ':user': user,
          ':status': restoredStatus,
          ':emptyList': [],
          ':visit': visit,
        },
        ReturnValues: 'ALL_NEW',
      })));
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        return fail(event, 'Patient not found', 404);
      }
      throw err;
    }

    return ok(event, Attributes);
  }

  if (!Number.isInteger(body.version)) {
    return fail(event, 'This patient record was updated elsewhere. Reload before saving again.', 409);
  }

  const now = new Date().toISOString();
  const { name, dob, mrn, formData, status, milestones } = body;
  const expectedVersion = body.version;
  const normalizedMilestones = milestones !== undefined
    ? normalizeMilestones(milestones, status || Item.status || 'Initial Eval')
    : null;
  const currentPendingOverrides = (Item.intakePendingOverrides && typeof Item.intakePendingOverrides === 'object')
    ? Item.intakePendingOverrides
    : {};
  const currentPendingProvenance = (Item.intakePendingProvenance && typeof Item.intakePendingProvenance === 'object')
    ? Item.intakePendingProvenance
    : {};
  const currentFormData = (Item.formData && typeof Item.formData === 'object' && !Array.isArray(Item.formData))
    ? cloneJson(Item.formData)
    : {};
  const currentFieldProvenance = (Item.fieldProvenance && typeof Item.fieldProvenance === 'object' && !Array.isArray(Item.fieldProvenance))
    ? cloneJson(Item.fieldProvenance)
    : {};
  const currentFieldHistory = (Item.fieldProvenanceHistory && typeof Item.fieldProvenanceHistory === 'object' && !Array.isArray(Item.fieldProvenanceHistory))
    ? cloneJson(Item.fieldProvenanceHistory)
    : {};
  const followupEntry = body.followupEntry !== undefined
    ? sanitizeFollowupEntry(body.followupEntry, user, now)
    : null;
  if (body.followupEntry !== undefined && !followupEntry) {
    return fail(event, 'Follow-up entry is incomplete or contains an invalid value.');
  }
  let remainingPendingOverrides = currentPendingOverrides;
  let remainingPendingProvenance = currentPendingProvenance;

  if (body.followupQuestionnaireReviewId !== undefined) {
    const reviewId = String(body.followupQuestionnaireReviewId || '').trim();
    const followups = Array.isArray(Item.followups) ? cloneJson(Item.followups) : [];
    const entry = followups.find(item => item?.followupId === reviewId && item.patientSubmitted === true);
    if (!entry) return fail(event, 'Follow-up questionnaire not found.', 404);
    if (entry.reviewStatus === 'reviewed') return ok(event, Item);
    entry.reviewStatus = 'reviewed';
    entry.reviewedAt = now;
    entry.reviewedBy = user;
    const pendingCount = followups.filter(item => item?.patientSubmitted && item.reviewStatus !== 'reviewed').length;
    const visit = [{ date: now, user, action: 'Patient follow-up questionnaire reviewed' }];
    let Attributes;
    try {
      ({ Attributes } = await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { patientId: id },
        UpdateExpression: 'SET #followups = :followups, #pendingCount = :pendingCount, #u = :now, #ub = :user, #visits = list_append(if_not_exists(#visits, :emptyList), :visit), #ver = :nextVersion',
        ConditionExpression: 'attribute_exists(patientId) AND ((attribute_not_exists(#ver) AND :expectedVersion = :legacyVersion) OR #ver = :expectedVersion)',
        ExpressionAttributeNames: {
          '#followups': 'followups', '#pendingCount': 'followupQuestionnairePendingCount', '#u': 'updatedAt',
          '#ub': 'updatedBy', '#visits': 'visits', '#ver': 'version',
        },
        ExpressionAttributeValues: {
          ':followups': followups, ':pendingCount': pendingCount, ':now': now, ':user': user,
          ':emptyList': [], ':visit': visit, ':expectedVersion': expectedVersion, ':legacyVersion': 1,
          ':nextVersion': expectedVersion + 1,
        },
        ReturnValues: 'ALL_NEW',
      })));
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        return fail(event, 'This patient record was updated elsewhere. Reload before saving again.', 409);
      }
      throw err;
    }
    return ok(event, Attributes);
  }

  if (body.intakeReview !== undefined) {
    const { note, resolutions } = sanitizeIntakeReview(body.intakeReview, currentPendingOverrides);
    if (!resolutions.length) {
      return fail(event, 'Select at least one intake field to review.');
    }

    const nextFormData = cloneJson(currentFormData);
    const nextFieldProvenance = cloneJson(currentFieldProvenance);
    let nextFieldHistory = cloneJson(currentFieldHistory);
    const nextPendingOverrides = cloneJson(currentPendingOverrides);
    const nextPendingProvenance = cloneJson(currentPendingProvenance);
    const acceptedFields = [];
    const keptChartFields = [];
    const resolvedFields = [];

    resolutions.forEach(({ field, action }) => {
      const intakeValue = cloneJson(currentPendingOverrides[field]);
      const chartValue = cloneJson(currentFormData[field]);
      const pendingMeta = currentPendingProvenance[field] || {};

      if (action === 'accept-intake') {
        nextFormData[field] = intakeValue;
        nextFieldProvenance[field] = {
          source: 'patient-intake-reviewed',
          updatedAt: now,
          updatedBy: user,
        };
        nextFieldHistory = appendFieldProvenanceHistoryEntry(nextFieldHistory, field, {
          source: 'patient-intake-reviewed',
          updatedAt: now,
          updatedBy: user,
          value: intakeValue,
          resolution: 'accepted',
          previousValue: chartValue,
          pendingSubmittedAt: pendingMeta.updatedAt || null,
          pendingSubmittedBy: pendingMeta.updatedBy || null,
        });
        acceptedFields.push(field);
      } else {
        nextFieldHistory = appendFieldProvenanceHistoryEntry(nextFieldHistory, field, {
          source: 'clinician-review',
          updatedAt: now,
          updatedBy: user,
          value: chartValue,
          resolution: 'kept-chart',
          pendingValue: intakeValue,
          pendingSubmittedAt: pendingMeta.updatedAt || null,
          pendingSubmittedBy: pendingMeta.updatedBy || null,
        });
        keptChartFields.push(field);
      }

      delete nextPendingOverrides[field];
      delete nextPendingProvenance[field];
      resolvedFields.push({
        field,
        action,
        chartValue,
        intakeValue,
      });
    });

    const remainingPendingKeys = Object.keys(nextPendingOverrides);
    const reviewEntry = {
      reviewedAt: now,
      reviewedBy: user,
      acceptedFields,
      keptChartFields,
      remainingPendingFieldCount: remainingPendingKeys.length,
      resolvedFields: resolvedFields.slice(0, INTAKE_REVIEW_FIELD_PREVIEW_LIMIT),
      resolvedFieldCount: resolvedFields.length,
    };
    if (note) {
      reviewEntry.note = note;
    }
    if (resolvedFields.length > INTAKE_REVIEW_FIELD_PREVIEW_LIMIT) {
      reviewEntry.resolvedFieldsTruncated = true;
    }
    const reviewVisit = buildVisitEntry({
      action: remainingPendingKeys.length ? 'Intake review updated' : 'Intake review completed',
      user,
      timestamp: now,
      previousFormData: currentFormData,
      nextFormData,
      changedRecordFields: ['intakeReview'],
    });
    const nextReviewHistory = appendIntakeReviewHistory(Item.intakeReviewHistory, reviewEntry);

    const reviewNames = {
      '#u': 'updatedAt',
      '#ub': 'updatedBy',
      '#visits': 'visits',
      '#ver': 'version',
      '#fd': 'formData',
      '#fp': 'fieldProvenance',
      '#fph': 'fieldProvenanceHistory',
      '#irh': 'intakeReviewHistory',
      '#ipfc': 'intakePendingFieldCount',
      '#ipp': 'intakePendingProvenance',
      '#ipo': 'intakePendingOverrides',
      '#is': 'intakeStatus',
      '#irby': 'intakeLastReviewedBy',
      '#lvefFollowupNeeded': 'lvefFollowupNeeded',
    };
    const reviewUpdates = {
      ':now': now,
      ':user': user,
      ':visit': [reviewVisit],
      ':emptyList': [],
      ':expectedVersion': expectedVersion,
      ':legacyVersion': 1,
      ':nextVersion': expectedVersion + 1,
      ':fd': nextFormData,
      ':fp': nextFieldProvenance,
      ':fph': nextFieldHistory,
      ':irh': nextReviewHistory,
      ':pendingCount': remainingPendingKeys.length,
      ':reviewedBy': user,
      ':reviewed': 'reviewed',
      ':lvefFollowupNeeded': needsLvefFollowup(nextFormData),
    };
    let reviewExpr =
      'SET #u = :now, #ub = :user, #visits = list_append(if_not_exists(#visits, :emptyList), :visit), #ver = :nextVersion, ' +
      '#fd = :fd, #fp = :fp, #fph = :fph, #irh = :irh, #ipfc = :pendingCount, intakeReviewedAt = :now, #irby = :reviewedBy, #lvefFollowupNeeded = :lvefFollowupNeeded';
    const reviewRemove = [];

    if (remainingPendingKeys.length) {
      reviewExpr += ', #ipo = :ipo, #ipp = :ipp, #is = :reviewNeeded';
      reviewUpdates[':ipo'] = nextPendingOverrides;
      reviewUpdates[':ipp'] = nextPendingProvenance;
      reviewUpdates[':reviewNeeded'] = 'review-needed';
    } else {
      reviewExpr += ', #is = :reviewed';
      reviewRemove.push('#ipo', '#ipp');
    }

    if (reviewRemove.length) {
      reviewExpr += ' REMOVE ' + reviewRemove.join(', ');
    }

    let Attributes;
    try {
      ({ Attributes } = await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { patientId: id },
        UpdateExpression: reviewExpr,
        ExpressionAttributeValues: reviewUpdates,
        ExpressionAttributeNames: reviewNames,
        ConditionExpression: 'attribute_exists(patientId) AND ((attribute_not_exists(#ver) AND :expectedVersion = :legacyVersion) OR #ver = :expectedVersion)',
        ReturnValues: 'ALL_NEW',
      })));
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        return fail(event, 'This patient record was updated elsewhere. Reload before saving again.', 409);
      }
      throw err;
    }

    return ok(event, Attributes);
  }

  const changedRecordFields = [];
  if (name !== undefined && name.trim() !== (Item.name || '')) changedRecordFields.push('name');
  if (dob !== undefined && dob !== (Item.dob || '')) changedRecordFields.push('dob');
  if (mrn !== undefined && (mrn || '').trim() !== (Item.mrn || '')) changedRecordFields.push('mrn');
  if (normalizedMilestones && JSON.stringify(normalizedMilestones) !== JSON.stringify(Array.isArray(Item.milestones) ? Item.milestones : [])) {
    changedRecordFields.push('milestones');
  } else if (status !== undefined && status !== (Item.status || '')) {
    changedRecordFields.push('status');
  }
  if (body.reportSnapshot !== undefined) changedRecordFields.push('reportSnapshots');
  if (followupEntry) changedRecordFields.push('followups');
  const changedFormFields = formData !== undefined
    ? getMeaningfulChangedFields(currentFormData, formData)
    : [];
  const identityChangedFields = changedRecordFields.filter((field) => ['name', 'dob', 'mrn'].includes(field));
  const nextProvenanceValues = {
    ...(formData !== undefined ? formData : currentFormData),
    name: name !== undefined ? name.trim() : (Item.name || ''),
    dob: dob !== undefined ? dob : (Item.dob || ''),
    mrn: mrn !== undefined ? (mrn || '').trim() : (Item.mrn || ''),
  };

  const visit = buildVisitEntry({
    action: body.visitAction || 'Updated',
    user,
    timestamp: now,
    previousFormData: currentFormData,
    nextFormData: formData !== undefined ? formData : currentFormData,
    changedRecordFields,
    reportSnapshotSaved: body.reportSnapshot !== undefined,
  });

  const updates = {
    ':now': now,
    ':user': user,
    ':visit': [visit],
    ':emptyList': [],
    ':expectedVersion': expectedVersion,
    ':legacyVersion': 1,
    ':nextVersion': expectedVersion + 1,
  };
  const names = {
    '#u': 'updatedAt',
    '#ub': 'updatedBy',
    '#visits': 'visits',
    '#ver': 'version',
  };
  let expr = 'SET #u = :now, #ub = :user, #visits = list_append(if_not_exists(#visits, :emptyList), :visit), #ver = :nextVersion';
  const removeExpr = [];

  if (name !== undefined) {
    expr += ', #n = :name, #nl = :nameLower, #nsb = :nameSearchBucket, #gnl = :givenNameLower, #gnsb = :givenNameSearchBucket';
    updates[':name'] = name.trim();
    updates[':nameLower'] = normalizeNameForSearch(name);
    updates[':nameSearchBucket'] = buildNameSearchBucket(name);
    updates[':givenNameLower'] = extractGivenNameForSearch(name);
    updates[':givenNameSearchBucket'] = buildGivenNameSearchBucket(name);
    names['#n'] = 'name';
    names['#nl'] = 'nameLower';
    names['#nsb'] = 'nameSearchBucket';
    names['#gnl'] = 'givenNameLower';
    names['#gnsb'] = 'givenNameSearchBucket';
  }
  if (dob !== undefined) {
    expr += ', dob = :dob';
    updates[':dob'] = dob;
  }
  if (mrn !== undefined) {
    // mrn is the mrn-index GSI key: SET it only when non-empty; REMOVE it when cleared
    // (empty-string key attributes are rejected by DynamoDB; REMOVE keeps the index sparse).
    const trimmedMrn = (mrn || '').trim();
    if (trimmedMrn) {
      expr += ', mrn = :mrn';
      updates[':mrn'] = trimmedMrn;
    } else {
      removeExpr.push('mrn');
    }
  }
  if (formData !== undefined) {
    expr += ', formData = :fd, #lvefFollowupNeeded = :lvefFollowupNeeded';
    updates[':fd'] = formData;
    updates[':lvefFollowupNeeded'] = needsLvefFollowup(formData);
    names['#lvefFollowupNeeded'] = 'lvefFollowupNeeded';
    if (Object.keys(currentPendingOverrides).length) {
      remainingPendingOverrides = {};
      for (const [key, pendingValue] of Object.entries(currentPendingOverrides)) {
        if (!formValuesEqual(formData[key], pendingValue)) {
          remainingPendingOverrides[key] = pendingValue;
        }
      }
      remainingPendingProvenance = filterPendingMetadata(currentPendingProvenance, Object.keys(remainingPendingOverrides));

      if (Object.keys(remainingPendingOverrides).length) {
        expr += ', #ipo = :ipo, #ipfc = :ipfc, #is = :reviewNeeded';
        names['#ipo'] = 'intakePendingOverrides';
        names['#ipfc'] = 'intakePendingFieldCount';
        names['#is'] = 'intakeStatus';
        updates[':ipo'] = remainingPendingOverrides;
        updates[':ipfc'] = Object.keys(remainingPendingOverrides).length;
        updates[':reviewNeeded'] = 'review-needed';
        expr += ', #ipp = :ipp';
        names['#ipp'] = 'intakePendingProvenance';
        updates[':ipp'] = remainingPendingProvenance;
      } else {
        expr += ', #is = :reviewed, intakeReviewedAt = :now';
        names['#is'] = 'intakeStatus';
        updates[':reviewed'] = 'reviewed';
        removeExpr.push('#ipo', '#ipfc', '#ipp');
        names['#ipo'] = 'intakePendingOverrides';
        names['#ipfc'] = 'intakePendingFieldCount';
        names['#ipp'] = 'intakePendingProvenance';
      }
    }
  }
  const provenanceFields = [...new Set([...changedFormFields, ...identityChangedFields])];
  if (provenanceFields.length) {
    expr += ', #fp = :fp, #fph = :fph';
    names['#fp'] = 'fieldProvenance';
    names['#fph'] = 'fieldProvenanceHistory';
    updates[':fp'] = updateFieldProvenance(currentFieldProvenance, provenanceFields, 'clinician', user, now);
    updates[':fph'] = appendFieldProvenanceHistory(currentFieldHistory, provenanceFields, 'clinician', user, now, nextProvenanceValues, () => ({
      event: 'chart-save',
    }));
  }
  if (normalizedMilestones) {
    expr += ', milestones = :ms, #s = :status';
    updates[':ms'] = normalizedMilestones;
    updates[':status'] = derivePatientStatus(normalizedMilestones, status || Item.status || 'Initial Eval');
    names['#s'] = 'status';
  } else if (status !== undefined) {
    expr += ', #s = :status';
    updates[':status'] = status;
    names['#s'] = 'status';
  }
  if (body.reportSnapshot !== undefined) {
    const reportSnapshots = buildReportSnapshots(Item.reportSnapshots, body.reportSnapshot, user, now);
    expr += ', #rs = :rs, #rsc = :rsc, #lrs = :lrs';
    names['#rs'] = 'reportSnapshots';
    names['#rsc'] = 'reportSnapshotCount';
    names['#lrs'] = 'latestReportSnapshotAt';
    updates[':rs'] = reportSnapshots;
    updates[':rsc'] = reportSnapshots.length;
    updates[':lrs'] = now;
  }
  if (followupEntry) {
    const followups = Array.isArray(Item.followups) ? cloneJson(Item.followups) : [];
    followups.push(followupEntry);
    const retainedFollowups = followups.slice(-FOLLOWUP_LIMIT);
    expr += ', #fu = :fu, #fuc = :fuc, #lfu = :lfu';
    names['#fu'] = 'followups';
    names['#fuc'] = 'followupCount';
    names['#lfu'] = 'latestFollowupAt';
    updates[':fu'] = retainedFollowups;
    updates[':fuc'] = retainedFollowups.length;
    updates[':lfu'] = now;
  }
  if (removeExpr.length) {
    expr += ' REMOVE ' + removeExpr.join(', ');
  }

  let Attributes;
  try {
    ({ Attributes } = await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { patientId: id },
      UpdateExpression: expr,
      ExpressionAttributeValues: updates,
      ExpressionAttributeNames: names,
      ConditionExpression: 'attribute_exists(patientId) AND ((attribute_not_exists(#ver) AND :expectedVersion = :legacyVersion) OR #ver = :expectedVersion)',
      ReturnValues: 'ALL_NEW',
    })));
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return fail(event, 'This patient record was updated elsewhere. Reload before saving again.', 409);
    }
    throw err;
  }

  return ok(event, Attributes);
}

async function deletePatient(event, id, user) {
  const now = new Date().toISOString();
  const visit = [{
    date: now,
    user,
    action: 'Archived',
  }];

  let Attributes;
  try {
    ({ Attributes } = await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { patientId: id },
      UpdateExpression: 'SET isDeleted = :true, deletedAt = :now, deletedBy = :user, #u = :now, #ub = :user, #s = :archived, #visits = list_append(if_not_exists(#visits, :emptyList), :visit)',
      ConditionExpression: 'attribute_exists(patientId) AND (attribute_not_exists(isDeleted) OR isDeleted = :false)',
      ExpressionAttributeNames: {
        '#u': 'updatedAt',
        '#ub': 'updatedBy',
        '#s': 'status',
        '#visits': 'visits',
      },
      ExpressionAttributeValues: {
        ':true': true,
        ':false': false,
        ':now': now,
        ':user': user,
        ':archived': 'Archived',
        ':emptyList': [],
        ':visit': visit,
      },
      ReturnValues: 'ALL_NEW',
    })));
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return fail(event, 'Patient not found', 404);
    }
    throw err;
  }

  return ok(event, { archived: Attributes?.patientId || id });
}

async function searchPatients(event, params, userGroups, user) {
  const rawQuery = (params?.q || '').trim();
  const q = rawQuery.toLowerCase();
  if (!q) return ok(event, []);
  const includeArchived = String(params?.includeArchived || '').toLowerCase();
  const showArchived = ['1', 'true', 'yes'].includes(includeArchived) && hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME]);
  const projection = 'patientId, #n, dob, mrn, #s, milestones, updatedAt, intakeStatus, intakeReceivedAt, intakePendingFieldCount, lvefFollowupNeeded, isDeleted, deletedAt, #v, reportSnapshotCount';
  const names = { '#n': 'name', '#s': 'status', '#v': 'version' };

  const finishSearch = (items, searchType) => {
    const results = (items || []).slice(0, 10);
    console.log(JSON.stringify({
      action: 'patient_search',
      searchType,
      resultCount: results.length,
      searchedBy: user,
      timestamp: new Date().toISOString(),
    }));
    return ok(event, results);
  };

  // DOB search is exact-only and backed by a GSI. Never scan the patient table.
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawQuery)) {
    const dobQuery = {
      TableName: TABLE,
      IndexName: 'dob-index',
      ProjectionExpression: projection,
      KeyConditionExpression: 'dob = :dob',
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: { ':dob': rawQuery },
      Limit: 10,
    };
    if (!showArchived) {
      dobQuery.FilterExpression = 'attribute_not_exists(isDeleted) OR isDeleted = :isDeletedFalse';
      dobQuery.ExpressionAttributeValues[':isDeletedFalse'] = false;
    }
    const { Items } = await ddb.send(new QueryCommand(dobQuery));
    return finishSearch(Items, 'dob_exact');
  }

  // Try MRN exact match first
  const mrnQuery = {
    TableName: TABLE,
    IndexName: 'mrn-index',
    ProjectionExpression: projection,
    KeyConditionExpression: 'mrn = :mrn',
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: { ':mrn': rawQuery },
    Limit: 10,
  };
  if (!showArchived) {
    mrnQuery.FilterExpression = 'attribute_not_exists(isDeleted) OR isDeleted = :isDeletedFalse';
    mrnQuery.ExpressionAttributeValues[':isDeletedFalse'] = false;
  }
  const { Items: mrnItems } = await ddb.send(new QueryCommand(mrnQuery));
  if (mrnItems?.length) return finishSearch(mrnItems, 'mrn_exact');

  // Try exact full-name match via existing nameLower GSI before scanning
  const nameQuery = {
    TableName: TABLE,
    IndexName: 'name-index',
    ProjectionExpression: projection,
    KeyConditionExpression: 'nameLower = :nameLower',
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: { ':nameLower': q },
    Limit: 10,
  };
  if (!showArchived) {
    nameQuery.FilterExpression = 'attribute_not_exists(isDeleted) OR isDeleted = :isDeletedFalse';
    nameQuery.ExpressionAttributeValues[':isDeletedFalse'] = false;
  }
  const { Items: exactNameItems } = await ddb.send(new QueryCommand(nameQuery));
  if (exactNameItems?.length) return finishSearch(exactNameItems, 'name_exact');

  // Try scalable prefix search for common last-name / chart-label lookups
  const prefixQuery = {
    TableName: TABLE,
    IndexName: 'name-prefix-index',
    ProjectionExpression: projection,
    KeyConditionExpression: 'nameSearchBucket = :bucket AND begins_with(nameLower, :prefix)',
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: {
      ':bucket': buildNameSearchBucket(q),
      ':prefix': q,
    },
    Limit: 10,
  };
  if (!showArchived) {
    prefixQuery.FilterExpression = 'attribute_not_exists(isDeleted) OR isDeleted = :isDeletedFalse';
    prefixQuery.ExpressionAttributeValues[':isDeletedFalse'] = false;
  }
  // Names are stored in chart style (Last, First). Query a second sparse GSI so
  // staff can begin typing the given name without scanning the patient table.
  const givenNamePrefixQuery = {
    TableName: TABLE,
    IndexName: 'given-name-prefix-index',
    ProjectionExpression: projection,
    KeyConditionExpression: 'givenNameSearchBucket = :bucket AND begins_with(givenNameLower, :prefix)',
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: {
      ':bucket': buildNameSearchBucket(q),
      ':prefix': q,
    },
    Limit: 10,
  };
  if (!showArchived) {
    givenNamePrefixQuery.FilterExpression = 'attribute_not_exists(isDeleted) OR isDeleted = :isDeletedFalse';
    givenNamePrefixQuery.ExpressionAttributeValues[':isDeletedFalse'] = false;
  }
  const [{ Items: prefixItems }, { Items: givenNameItems }] = await Promise.all([
    ddb.send(new QueryCommand(prefixQuery)),
    ddb.send(new QueryCommand(givenNamePrefixQuery)).catch((err) => {
      // Keep existing search paths available while a newly added GSI is still
      // backfilling, or if that optional index is temporarily unavailable.
      if (err?.name === 'ResourceNotFoundException' || err?.name === 'ValidationException') {
        return { Items: [] };
      }
      throw err;
    }),
  ]);
  const combined = [...(prefixItems || []), ...(givenNameItems || [])];
  if (combined.length) {
    const deduped = [...new Map(combined.map(item => [item.patientId, item])).values()];
    return finishSearch(deduped.sort((a, b) => (a.name || '').localeCompare(b.name || '')), 'name_prefix_combined');
  }
  return finishSearch([], 'none');
}
