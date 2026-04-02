/**
 * OSA Phenotyper – Patient CRUD + Intake Token API (Lambda handler)
 * Patient routes require Cognito JWT via API Gateway authorizer.
 * Token management routes also require Cognito JWT.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminListGroupsForUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  DynamoDBDocumentClient, GetCommand, PutCommand,
  UpdateCommand, ScanCommand, QueryCommand
} from '@aws-sdk/lib-dynamodb';
import { randomUUID, randomBytes, createHash } from 'node:crypto';

const TABLE = process.env.TABLE_NAME;
const TOKEN_TABLE = process.env.TOKEN_TABLE;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const ADMIN_GROUP_NAME = process.env.ADMIN_GROUP_NAME || 'osa-admin';
const CLINICIAN_GROUP_NAME = process.env.CLINICIAN_GROUP_NAME || 'osa-clinician';
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const REPORT_SNAPSHOT_LIMIT = 5;
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

function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function buildFieldProvenance(existing, formData, source, user, timestamp) {
  const provenance = (existing && typeof existing === 'object' && !Array.isArray(existing))
    ? { ...existing }
    : {};

  if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
    return provenance;
  }

  Object.keys(formData).forEach((field) => {
    provenance[field] = {
      source,
      updatedAt: timestamp,
      updatedBy: user,
    };
  });

  return provenance;
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
  const userGroups = await getUserGroups(event);

  try {
    if (method === 'OPTIONS') {
      return ok(event, {});
    }

    // GET /patients/search?q=...
    if (method === 'GET' && path === '/patients/search') {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME, CLINICIAN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      return await searchPatients(event, event.queryStringParameters, userGroups);
    }
    // GET /patients/:id
    if (method === 'GET' && path.match(/^\/patients\/[^/]+$/)) {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME, CLINICIAN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      const id = path.split('/').pop();
      return await getPatient(event, id);
    }
    // GET /patients
    if (method === 'GET' && path === '/patients') {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME, CLINICIAN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      return await listPatients(event, event.queryStringParameters, userGroups);
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

    // ── Intake Token Management Routes ──────────────────────
    // POST /intake-tokens — generate a new intake token for a patient
    if (method === 'POST' && path === '/intake-tokens') {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME, CLINICIAN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      const body = JSON.parse(event.body || '{}');
      return await createIntakeToken(event, body, user);
    }
    // GET /intake-tokens/:patientId — list active tokens for a patient
    if (method === 'GET' && path.match(/^\/intake-tokens\/[^/]+$/)) {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME, CLINICIAN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      const patientId = path.split('/').pop();
      return await listIntakeTokens(event, patientId);
    }
    // DELETE /intake-tokens/:tokenHash — revoke an active token
    if (method === 'DELETE' && path.match(/^\/intake-tokens\/[^/]+$/)) {
      if (!hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME, CLINICIAN_GROUP_NAME])) return fail(event, 'Forbidden', 403);
      const tokenHash = path.split('/').pop();
      return await revokeIntakeToken(event, tokenHash, user);
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

/* ── CRUD operations ──────────────────────────────────────── */

async function createPatient(event, body, user) {
  const { name, dob, mrn, formData, status, milestones } = body;
  if (!name || !dob) return fail(event, 'Name and DOB are required');

  const now = new Date().toISOString();
  const normalizedMilestones = normalizeMilestones(milestones, status || 'Initial Eval');
  const normalizedFormData = formData || {};
  const item = {
    patientId: randomUUID(),
    name: name.trim(),
    nameLower: name.trim().toLowerCase(),
    dob,
    mrn: (mrn || '').trim(),
    status: derivePatientStatus(normalizedMilestones, status || 'Initial Eval'),
    milestones: normalizedMilestones,
    formData: normalizedFormData,
    fieldProvenance: buildFieldProvenance({}, normalizedFormData, 'clinician', user, now),
    visits: [{
      date: now,
      user,
      action: 'Created',
      formSnapshot: normalizedFormData,
    }],
    createdAt: now,
    updatedAt: now,
    createdBy: user,
    updatedBy: user,
    version: 1,
  };

  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return ok(event, item, 201);
}

async function getPatient(event, id) {
  const { Item } = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { patientId: id },
  }));
  if (!Item || Item.isDeleted) return fail(event, 'Patient not found', 404);
  return ok(event, Item);
}

async function listPatients(event, params, userGroups) {
  const includeArchived = String(params?.includeArchived || '').toLowerCase();
  const showArchived = ['1', 'true', 'yes'].includes(includeArchived) && hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME]);
  const scanParams = {
    TableName: TABLE,
    ProjectionExpression: 'patientId, #n, dob, mrn, #s, milestones, updatedAt, intakeStatus, intakeReceivedAt, isDeleted, deletedAt, #v, reportSnapshotCount',
    ExpressionAttributeNames: { '#n': 'name', '#s': 'status', '#v': 'version' },
  };

  if (!showArchived) {
    scanParams.FilterExpression = 'attribute_not_exists(isDeleted) OR isDeleted = :isDeletedFalse';
    scanParams.ExpressionAttributeValues = { ':isDeletedFalse': false };
  }

  const { Items } = await ddb.send(new ScanCommand(scanParams));
  // Sort by most recently updated
  const sorted = (Items || []).sort((a, b) =>
    (b.updatedAt || '').localeCompare(a.updatedAt || '')
  );
  return ok(event, sorted);
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
  let remainingPendingOverrides = currentPendingOverrides;
  let remainingPendingProvenance = currentPendingProvenance;

  // Build visit entry
  const visit = {
    date: now,
    user,
    action: body.visitAction || 'Updated',
    formSnapshot: formData || Item.formData || {},
  };

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
    expr += ', #n = :name, #nl = :nameLower';
    updates[':name'] = name.trim();
    updates[':nameLower'] = name.trim().toLowerCase();
    names['#n'] = 'name';
    names['#nl'] = 'nameLower';
  }
  if (dob !== undefined) {
    expr += ', dob = :dob';
    updates[':dob'] = dob;
  }
  if (mrn !== undefined) {
    expr += ', mrn = :mrn';
    updates[':mrn'] = (mrn || '').trim();
  }
  if (formData !== undefined) {
    expr += ', formData = :fd';
    updates[':fd'] = formData;
    expr += ', #fp = :fp';
    names['#fp'] = 'fieldProvenance';
    updates[':fp'] = buildFieldProvenance(Item.fieldProvenance, formData, 'clinician', user, now);

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

async function searchPatients(event, params, userGroups) {
  const q = (params?.q || '').trim().toLowerCase();
  if (!q) return ok(event, []);
  const includeArchived = String(params?.includeArchived || '').toLowerCase();
  const showArchived = ['1', 'true', 'yes'].includes(includeArchived) && hasRequiredGroup(userGroups, [ADMIN_GROUP_NAME]);

  // Try MRN exact match first
  const mrnQuery = {
    TableName: TABLE,
    IndexName: 'mrn-index',
    ProjectionExpression: 'patientId, #n, dob, mrn, #s, milestones, updatedAt, intakeStatus, intakeReceivedAt, isDeleted, deletedAt, #v, reportSnapshotCount',
    KeyConditionExpression: 'mrn = :mrn',
    ExpressionAttributeNames: { '#n': 'name', '#s': 'status', '#v': 'version' },
    ExpressionAttributeValues: { ':mrn': q, ':isDeletedFalse': false },
  };
  if (!showArchived) {
    mrnQuery.FilterExpression = 'attribute_not_exists(isDeleted) OR isDeleted = :isDeletedFalse';
  }
  const { Items: mrnItems } = await ddb.send(new QueryCommand(mrnQuery));
  if (mrnItems?.length) return ok(event, mrnItems);

  // Fall back to name scan (fine for small datasets)
  const nameScan = {
    TableName: TABLE,
    ProjectionExpression: 'patientId, #n, dob, mrn, #s, milestones, updatedAt, intakeStatus, intakeReceivedAt, isDeleted, deletedAt, #v, reportSnapshotCount',
    ExpressionAttributeNames: { '#n': 'name', '#s': 'status', '#v': 'version' },
    ExpressionAttributeValues: { ':q': q, ':isDeletedFalse': false },
  };
  nameScan.FilterExpression = showArchived
    ? 'contains(nameLower, :q)'
    : '(attribute_not_exists(isDeleted) OR isDeleted = :isDeletedFalse) AND contains(nameLower, :q)';
  const { Items: nameItems } = await ddb.send(new ScanCommand(nameScan));
  return ok(event, nameItems || []);
}

/* ── Intake Token Management ─────────────────────────────── */

/**
 * POST /intake-tokens
 * Generate a time-limited, single-use intake token for a patient.
 * Token is returned once; only SHA-256 hash is stored.
 */
async function createIntakeToken(event, body, user) {
  const { patientId } = body;
  if (!patientId) return fail(event, 'patientId is required');

  // Verify patient exists
  const { Item: patient } = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { patientId },
    ProjectionExpression: '#n, isDeleted',
    ExpressionAttributeNames: { '#n': 'name' },
  }));
  if (!patient || patient.isDeleted) return fail(event, 'Patient not found', 404);

  // Generate 256-bit cryptographically random token
  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  // Extract first name only (for patient greeting — minimal PHI)
  const fullName = patient.name || '';
  const firstName = fullName.includes(',')
    ? fullName.split(',').pop().trim().split(' ')[0]   // "Last, First Middle" → "First"
    : fullName.split(' ')[0];                            // "First Last" → "First"

  const now = new Date();
  const expiresAt = Math.floor(now.getTime() / 1000) + (72 * 60 * 60); // 72 hours
  const ttl = expiresAt + (30 * 24 * 60 * 60); // TTL: 30 days after expiry for audit

  await ddb.send(new PutCommand({
    TableName: TOKEN_TABLE,
    Item: {
      tokenHash,
      patientId,
      expiresAt,
      ttl,
      status: 'active',
      createdAt: now.toISOString(),
      createdBy: user,
      usedAt: null,
      attempts: 0,
      patientFirstName: firstName || 'Patient',
    },
  }));

  // Audit log (no PHI — only patientId and action)
  console.log(JSON.stringify({
    action: 'intake_token_created',
    patientId,
    createdBy: user,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    timestamp: now.toISOString(),
  }));

  return ok(event, {
    token: rawToken,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  }, 201);
}

/**
 * GET /intake-tokens/:patientId
 * List active/used tokens for a patient (for clinician revocation UI).
 */
async function listIntakeTokens(event, patientId) {
  const { Items } = await ddb.send(new QueryCommand({
    TableName: TOKEN_TABLE,
    IndexName: 'patient-index',
    KeyConditionExpression: 'patientId = :pid',
    ExpressionAttributeValues: { ':pid': patientId },
    ProjectionExpression: 'tokenHash, #s, expiresAt, createdAt, createdBy, usedAt',
    ExpressionAttributeNames: { '#s': 'status' },
  }));

  const now = Math.floor(Date.now() / 1000);
  const tokens = (Items || []).map(t => ({
    tokenHash: t.tokenHash,
    status: t.status === 'active' && t.expiresAt <= now ? 'expired' : t.status,
    expiresAt: new Date(t.expiresAt * 1000).toISOString(),
    createdAt: t.createdAt,
    createdBy: t.createdBy,
    usedAt: t.usedAt,
  }));

  // Sort by createdAt desc
  tokens.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return ok(event, tokens);
}

/**
 * DELETE /intake-tokens/:tokenHash
 * Revoke an active token (sets status to 'revoked').
 */
async function revokeIntakeToken(event, tokenHash, user) {
  try {
    await ddb.send(new UpdateCommand({
      TableName: TOKEN_TABLE,
      Key: { tokenHash },
      UpdateExpression: 'SET #s = :revoked, revokedAt = :now, revokedBy = :user',
      ConditionExpression: '#s = :active',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':revoked': 'revoked',
        ':active': 'active',
        ':now': new Date().toISOString(),
        ':user': user,
      },
    }));

    console.log(JSON.stringify({
      action: 'intake_token_revoked',
      tokenHash: tokenHash.substring(0, 8) + '...',
      revokedBy: user,
      timestamp: new Date().toISOString(),
    }));

    return ok(event, { revoked: true });
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return fail(event, 'Token is not active or does not exist', 404);
    }
    throw err;
  }
}
