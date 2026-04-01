/**
 * OSA Phenotyper – Patient Intake API (Lambda handler)
 * HIPAA-compliant: No PHI logged. Token-based auth (no Cognito).
 *
 * Routes:
 *   GET  /intake/{token}  – validate magic-link token, return minimal info
 *   POST /intake/{token}  – submit intake form, merge into patient record
 *
 * Security:
 *   - Tokens are SHA-256 hashed before DB lookup (never stored in plain text)
 *   - All errors return generic messages (no info leakage)
 *   - Request bodies, patient data, and token values are NEVER logged
 *   - IAM restricted: minimal patient reads plus transactional writes on patients/tokens
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { createHash } from 'node:crypto';

/* ── Configuration ───────────────────────────────────────── */

const PATIENT_TABLE = process.env.PATIENT_TABLE;
const TOKEN_TABLE   = process.env.TOKEN_TABLE;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const ddb           = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const MAX_TOKEN_ATTEMPTS = 5;

/* ── CORS + security response headers ────────────────────── */

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
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Referrer-Policy': 'no-referrer',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

/* ── Response helpers ────────────────────────────────────── */

const ok   = (event, body, code = 200) => ({ statusCode: code, headers: buildHeaders(event), body: JSON.stringify(body) });
const fail = (event, msg, code = 400)  => ({ statusCode: code, headers: buildHeaders(event), body: JSON.stringify({ error: msg }) });

/** Generic token-failure message — never reveals which check failed. */
const TOKEN_INVALID_MSG = 'This link is invalid or has expired.';

/* ── Route dispatcher ────────────────────────────────────── */

export async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path   = event.requestContext?.http?.path   || event.path;

  try {
    // OPTIONS preflight
    if (method === 'OPTIONS') {
      return ok(event, {});
    }

    // GET /intake/{token}
    if (method === 'GET' && path.match(/^\/intake\/[^/]+$/)) {
      const token = path.split('/').pop();
      return await handleGetIntake(event, token);
    }

    // POST /intake/{token}
    if (method === 'POST' && path.match(/^\/intake\/[^/]+$/)) {
      const token = path.split('/').pop();
      return await handlePostIntake(event, token, event.body);
    }

    return fail(event, 'Not found', 404);
  } catch (err) {
    // Log error type only — no request bodies or PHI
    console.log(JSON.stringify({
      action: 'intake_unhandled_error',
      errorType: err.name || 'Error',
      timestamp: new Date().toISOString(),
    }));
    return fail(event, 'Internal server error', 500);
  }
}

/* ── Token utilities ─────────────────────────────────────── */

/**
 * Hash a raw token string with SHA-256.
 * The tokens table stores hashes, never plain tokens.
 */
function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Increment the attempts counter on a token record.
 * Used on every failed validation to enable brute-force lockout.
 */
async function incrementAttempts(tokenHash) {
  try {
    await ddb.send(new UpdateCommand({
      TableName: TOKEN_TABLE,
      Key: { tokenHash },
      UpdateExpression: 'ADD attempts :one',
      ConditionExpression: 'attribute_exists(tokenHash)',
      ExpressionAttributeValues: { ':one': 1 },
    }));
  } catch (_) {
    // Best-effort — do not let counter failure mask the real error
  }
}

/**
 * Validate a token record against all security checks.
 * Returns { valid: true, record } or { valid: false, reason }.
 * The `reason` is only for server-side logging; it is NEVER sent to the client.
 */
function validateTokenRecord(record) {
  if (!record) {
    return { valid: false, reason: 'not_found' };
  }
  if (record.status !== 'active') {
    return { valid: false, reason: 'status_not_active' };
  }
  const nowEpoch = Math.floor(Date.now() / 1000);
  if (!record.expiresAt || record.expiresAt <= nowEpoch) {
    return { valid: false, reason: 'expired' };
  }
  if (typeof record.attempts === 'number' && record.attempts >= MAX_TOKEN_ATTEMPTS) {
    return { valid: false, reason: 'max_attempts' };
  }
  return { valid: true, record };
}

/**
 * Full token lookup + validation flow.
 * Returns the same shape as validateTokenRecord, plus tokenHash for later use.
 */
async function lookupAndValidateToken(rawToken) {
  const tokenHash = hashToken(rawToken);

  const { Item: record } = await ddb.send(new GetCommand({
    TableName: TOKEN_TABLE,
    Key: { tokenHash },
  }));

  const result = validateTokenRecord(record);

  if (!result.valid) {
    await incrementAttempts(tokenHash);
    console.log(JSON.stringify({
      action: 'intake_validate_failed',
      reason: 'generic',
      timestamp: new Date().toISOString(),
    }));
  }

  return { ...result, tokenHash };
}

/* ── GET /intake/{token} ─────────────────────────────────── */

async function handleGetIntake(event, rawToken) {
  const { valid, record, tokenHash } = await lookupAndValidateToken(rawToken);

  if (!valid) {
    return fail(event, TOKEN_INVALID_MSG, 403);
  }

  const { Item: patient } = await ddb.send(new GetCommand({
    TableName: PATIENT_TABLE,
    Key: { patientId: record.patientId },
    ProjectionExpression: 'patientId, isDeleted',
  }));
  if (!patient || patient.isDeleted) {
    console.log(JSON.stringify({
      action: 'intake_validate_patient_unavailable',
      patientId: record.patientId,
      timestamp: new Date().toISOString(),
    }));
    return fail(event, TOKEN_INVALID_MSG, 403);
  }

  console.log(JSON.stringify({
    action: 'intake_validate_success',
    patientId: record.patientId,
    timestamp: new Date().toISOString(),
  }));

  return ok(event, {
    valid: true,
    firstName: record.patientFirstName,
    expiresAt: new Date(record.expiresAt * 1000).toISOString(),
  });
}

/* ── Input validation ────────────────────────────────────── */

/** Strip HTML tags from a string value. */
function stripHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '');
}

/** Check that a value is an integer within [min, max]. */
function isIntInRange(val, min, max) {
  return Number.isInteger(val) && val >= min && val <= max;
}

/** Check that a value is a finite number within [min, max]. */
function isNumInRange(val, min, max) {
  return typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max;
}

/** Allowed reason codes for stopping CPAP. */
const VALID_CPAP_REASONS = new Set([
  'mask', 'claustrophobia', 'dryMouth', 'leaks',
  'troubleSleeping', 'skinIrritation', 'noImprovement', 'travel',
]);

const CHECKBOX_STYLE_FORM_KEYS = new Set([
  'nasalObs', 'snoringReported', 'prefAvoidCpap', 'prefSurgery', 'prefInspire',
  'priorUPPP', 'priorNasal', 'priorSinus', 'priorJaw', 'priorInspire', 'priorMAD',
  'priorCpap', 'cpapCurrent', 'cpapMask', 'cpapClaustro', 'cpapDry', 'cpapLeaks',
  'cpapSleep', 'cpapSkin', 'cpapNoImprove', 'cpapTravel',
]);

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

function updateFieldProvenance(existing, fields, source, user, timestamp) {
  const provenance = (existing && typeof existing === 'object' && !Array.isArray(existing))
    ? { ...existing }
    : {};

  fields.forEach((field) => {
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

function hasMeaningfulIntakeValue(key, val) {
  if (CHECKBOX_STYLE_FORM_KEYS.has(key)) return val !== undefined && val !== null;
  return !isEmptyLike(val);
}

function buildIntakeMerge(currentFormData, intakeFormData, existingPendingOverrides) {
  const mergedFormData = {
    ...(currentFormData && typeof currentFormData === 'object' ? currentFormData : {}),
  };
  const pendingOverrides = {
    ...(existingPendingOverrides && typeof existingPendingOverrides === 'object' ? existingPendingOverrides : {}),
  };
  const appliedFields = [];
  const pendingFields = [];

  for (const [key, newValue] of Object.entries(intakeFormData)) {
    const hasCurrentKey = Object.prototype.hasOwnProperty.call(mergedFormData, key);
    const currentValue = mergedFormData[key];

    if (hasMeaningfulIntakeValue(key, newValue) && (!hasCurrentKey || isEmptyLike(currentValue))) {
      mergedFormData[key] = newValue;
      delete pendingOverrides[key];
      appliedFields.push(key);
      continue;
    }

    if (hasCurrentKey && formValuesEqual(currentValue, newValue)) {
      delete pendingOverrides[key];
      continue;
    }

    if (hasMeaningfulIntakeValue(key, newValue)) {
      pendingOverrides[key] = newValue;
      pendingFields.push(key);
    }
  }

  return {
    mergedFormData,
    pendingOverrides,
    appliedFields,
    pendingFields,
  };
}

/**
 * Validate and sanitize the full intake request body.
 * Returns { valid: true, data: sanitizedObject } or { valid: false, errors: ['field'] }.
 *
 * HIPAA note: `errors` contains only field names, never patient values.
 */
function validateIntakeData(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { valid: false, errors: ['body'] };
  }

  const errors = [];
  const data = {};

  // ── Demographics (required) ──────────────────────────────
  if (!isIntInRange(body.age, 1, 120)) {
    errors.push('age');
  } else {
    data.age = body.age;
  }

  if (body.sex !== 'M' && body.sex !== 'F') {
    errors.push('sex');
  } else {
    data.sex = body.sex;
  }

  if (!isNumInRange(body.heightInches, 48, 96)) {
    errors.push('heightInches');
  } else {
    data.heightInches = body.heightInches;
  }

  if (!isNumInRange(body.weightLbs, 50, 600)) {
    errors.push('weightLbs');
  } else {
    data.weightLbs = body.weightLbs;
  }

  // ── ESS: 8 questions, each 0-3 ──────────────────────────
  if (typeof body.ess !== 'object' || body.ess === null) {
    errors.push('ess');
  } else {
    data.ess = {};
    for (let i = 1; i <= 8; i++) {
      const key = `q${i}`;
      if (!isIntInRange(body.ess[key], 0, 3)) {
        errors.push(`ess.${key}`);
      } else {
        data.ess[key] = body.ess[key];
      }
    }
  }

  // ── ISI: 7 questions, each 0-4 ──────────────────────────
  if (typeof body.isi !== 'object' || body.isi === null) {
    errors.push('isi');
  } else {
    data.isi = {};
    for (let i = 1; i <= 7; i++) {
      const key = `q${i}`;
      if (!isIntInRange(body.isi[key], 0, 4)) {
        errors.push(`isi.${key}`);
      } else {
        data.isi[key] = body.isi[key];
      }
    }
  }

  // ── NOSE: 5 questions, each 0-4 ─────────────────────────
  if (typeof body.nose !== 'object' || body.nose === null) {
    errors.push('nose');
  } else {
    data.nose = {};
    for (let i = 1; i <= 5; i++) {
      const key = `q${i}`;
      if (!isIntInRange(body.nose[key], 0, 4)) {
        errors.push(`nose.${key}`);
      } else {
        data.nose[key] = body.nose[key];
      }
    }
  }

  // ── Simple boolean fields (optional, default false) ──────
  data.nasalObs = body.nasalObs === true;
  data.snoringReported = body.snoringReported === true;

  // ── Preferences (optional booleans) ──────────────────────
  if (body.preferences !== undefined) {
    if (typeof body.preferences !== 'object' || body.preferences === null) {
      errors.push('preferences');
    } else {
      data.preferences = {
        avoidCpap:          body.preferences.avoidCpap === true,
        openToSurgery:      body.preferences.openToSurgery === true,
        interestedInInspire: body.preferences.interestedInInspire === true,
      };
    }
  }

  // ── Prior treatments (optional booleans) ─────────────────
  if (body.priorTreatments !== undefined) {
    if (typeof body.priorTreatments !== 'object' || body.priorTreatments === null) {
      errors.push('priorTreatments');
    } else {
      data.priorTreatments = {
        uppp:         body.priorTreatments.uppp === true,
        nasalSurgery: body.priorTreatments.nasalSurgery === true,
        sinusSurgery: body.priorTreatments.sinusSurgery === true,
        jawSurgery:   body.priorTreatments.jawSurgery === true,
        inspire:      body.priorTreatments.inspire === true,
        mad:          body.priorTreatments.mad === true,
      };
    }
  }

  // ── CPAP history (optional, structured) ──────────────────
  if (body.cpapHistory !== undefined) {
    if (typeof body.cpapHistory !== 'object' || body.cpapHistory === null) {
      errors.push('cpapHistory');
    } else {
      const ch = body.cpapHistory;
      const cpap = {};

      if (ch.priorCpap !== true) {
        errors.push('cpapHistory.priorCpap');
      }
      cpap.priorCpap = ch.priorCpap === true;

      if (typeof ch.currentlyUsing !== 'boolean') {
        errors.push('cpapHistory.currentlyUsing');
      } else {
        cpap.currentlyUsing = ch.currentlyUsing;
      }

      // helped: one of "Yes", "No", "Unsure", ""
      const validHelped = new Set(['Yes', 'No', 'Unsure', '']);
      if (ch.helped !== undefined && ch.helped !== null) {
        const helpedVal = stripHtml(String(ch.helped));
        if (!validHelped.has(helpedVal)) {
          errors.push('cpapHistory.helped');
        } else {
          cpap.helped = helpedVal;
        }
      } else {
        cpap.helped = '';
      }

      // retryWilling: one of "Yes", "No", "Maybe", ""
      const validRetry = new Set(['Yes', 'No', 'Maybe', '']);
      if (cpap.currentlyUsing === false) {
        if (ch.retryWilling === undefined || ch.retryWilling === null || ch.retryWilling === '') {
          errors.push('cpapHistory.retryWilling');
        } else {
          const retryVal = stripHtml(String(ch.retryWilling));
          if (!validRetry.has(retryVal) || retryVal === '') {
            errors.push('cpapHistory.retryWilling');
          } else {
            cpap.retryWilling = retryVal;
          }
        }
      } else {
        cpap.retryWilling = '';
      }

      // pressure: number 4-25 or null
      if (ch.pressure !== undefined && ch.pressure !== null) {
        if (!isNumInRange(ch.pressure, 4, 25)) {
          errors.push('cpapHistory.pressure');
        } else {
          cpap.pressure = ch.pressure;
        }
      } else {
        cpap.pressure = null;
      }

      // reasonsStopped: array of allowed strings
      if (ch.reasonsStopped !== undefined && ch.reasonsStopped !== null) {
        if (!Array.isArray(ch.reasonsStopped)) {
          errors.push('cpapHistory.reasonsStopped');
        } else {
          const cleaned = [];
          for (const r of ch.reasonsStopped) {
            if (typeof r !== 'string' || !VALID_CPAP_REASONS.has(r)) {
              errors.push('cpapHistory.reasonsStopped');
              break;
            }
            cleaned.push(r);
          }
          cpap.reasonsStopped = cleaned;
        }
      } else {
        cpap.reasonsStopped = [];
      }

      data.cpapHistory = cpap;
    }
  }

  // ── Weight loss readiness (optional enum) ────────────────
  if (body.weightLossReadiness !== undefined && body.weightLossReadiness !== null) {
    const validWlr = new Set(['ready', 'considering', 'not-ready', '']);
    const wlrVal = stripHtml(String(body.weightLossReadiness));
    if (!validWlr.has(wlrVal)) {
      errors.push('weightLossReadiness');
    } else {
      data.weightLossReadiness = wlrVal;
    }
  }

  // ── Reject unexpected top-level fields ───────────────────
  const allowedKeys = new Set([
    'age', 'sex', 'heightInches', 'weightLbs',
    'ess', 'isi', 'nose',
    'nasalObs', 'snoringReported',
    'preferences', 'priorTreatments', 'cpapHistory',
    'weightLossReadiness',
  ]);
  for (const key of Object.keys(body)) {
    if (!allowedKeys.has(key)) {
      errors.push(key);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
}

/* ── Score computation ───────────────────────────────────── */

function computeScores(data) {
  // ESS total (0-24)
  let essTotal = 0;
  for (let i = 1; i <= 8; i++) essTotal += data.ess[`q${i}`];

  // ISI total (0-28)
  let isiTotal = 0;
  for (let i = 1; i <= 7; i++) isiTotal += data.isi[`q${i}`];

  // NOSE total (0-100): sum of 5 items * 5
  let noseRaw = 0;
  for (let i = 1; i <= 5; i++) noseRaw += data.nose[`q${i}`];
  const noseTotal = noseRaw * 5;

  // BMI: (weight in lbs * 703) / (height in inches)^2, rounded to 1 decimal
  const bmi = Math.round(((data.weightLbs * 703) / (data.heightInches * data.heightInches)) * 10) / 10;

  return { essTotal, isiTotal, noseTotal, bmi };
}

/* ── Field mapping ───────────────────────────────────────── */

/**
 * Map validated intake data to the field names expected by app.js
 * and OSADatabase.populateForm(). Boolean fields use 'on' / '' to match
 * HTML checkbox behavior.
 */
function mapToFormData(data, scores) {
  const formData = {
    age:              data.age,
    sex:              data.sex,
    bmi:              scores.bmi,
    ess:              scores.essTotal,
    isi:              scores.isiTotal,
    noseScore:        scores.noseTotal,
    nasalObs:         data.nasalObs ? 'on' : '',
    snoringReported:  data.snoringReported ? 'on' : '',
    prefAvoidCpap:    data.preferences?.avoidCpap ? 'on' : '',
    prefSurgery:      data.preferences?.openToSurgery ? 'on' : '',
    prefInspire:      data.preferences?.interestedInInspire ? 'on' : '',
    priorUPPP:        data.priorTreatments?.uppp ? 'on' : '',
    priorNasal:       data.priorTreatments?.nasalSurgery ? 'on' : '',
    priorSinus:       data.priorTreatments?.sinusSurgery ? 'on' : '',
    priorJaw:         data.priorTreatments?.jawSurgery ? 'on' : '',
    priorInspire:     data.priorTreatments?.inspire ? 'on' : '',
    priorMAD:         data.priorTreatments?.mad ? 'on' : '',
  };

  // CPAP history (conditional — only set fields if patient has prior CPAP)
  if (data.cpapHistory?.priorCpap) {
    formData.priorCpap  = 'on';
    formData.cpapCurrent = data.cpapHistory.currentlyUsing ? 'on' : '';
    formData.cpapHelped  = data.cpapHistory.helped || '';
    formData.cpapRetry   = data.cpapHistory.retryWilling || '';

    if (data.cpapHistory.pressure !== null) {
      formData.cpapPressure = data.cpapHistory.pressure;
    }

    // Map reason codes to individual checkbox-style fields
    const reasonMap = {
      mask:            'cpapMask',
      claustrophobia:  'cpapClaustro',
      dryMouth:        'cpapDry',
      leaks:           'cpapLeaks',
      troubleSleeping: 'cpapSleep',
      skinIrritation:  'cpapSkin',
      noImprovement:   'cpapNoImprove',
      travel:          'cpapTravel',
    };
    const reasons = data.cpapHistory.reasonsStopped || [];
    for (const [key, field] of Object.entries(reasonMap)) {
      formData[field] = reasons.includes(key) ? 'on' : '';
    }
  }

  // Weight loss readiness (pass through if present)
  if (data.weightLossReadiness) {
    formData.weightLossReadiness = data.weightLossReadiness;
  }

  return formData;
}

/* ── POST /intake/{token} ────────────────────────────────── */

async function handlePostIntake(event, rawToken, rawBody) {
  // ── 1. Validate token ────────────────────────────────────
  const { valid: tokenValid, record: tokenRecord, tokenHash } =
    await lookupAndValidateToken(rawToken);

  if (!tokenValid) {
    return fail(event, TOKEN_INVALID_MSG, 403);
  }

  // Check if already used (separate from generic validation so we
  // can return a distinct 409 to help the patient)
  // Note: this is already caught by status !== 'active' above,
  // but we include the 409 path for the edge case where a
  // concurrent request slips through.

  // ── 2. Parse request body ────────────────────────────────
  let body;
  try {
    body = JSON.parse(rawBody || '{}');
  } catch (_) {
    return fail(event, 'Please check your responses and try again.', 400);
  }

  // ── 3. Validate and sanitize ─────────────────────────────
  const validation = validateIntakeData(body);

  if (!validation.valid) {
    // Log field names only (no PHI, no values)
    console.log(JSON.stringify({
      action: 'intake_validation_failed',
      patientId: tokenRecord.patientId,
      invalidFields: validation.errors,
      timestamp: new Date().toISOString(),
    }));
    return fail(event, 'Please check your responses and try again.', 400);
  }

  const data = validation.data;

  // ── 4. Compute scores ────────────────────────────────────
  const scores = computeScores(data);
  const formData = mapToFormData(data, scores);
  const now = new Date().toISOString();

  const { Item: patient } = await ddb.send(new GetCommand({
    TableName: PATIENT_TABLE,
    Key: { patientId: tokenRecord.patientId },
    ProjectionExpression: 'patientId, formData, fieldProvenance, intakePendingOverrides, intakePendingProvenance, isDeleted, #v',
    ExpressionAttributeNames: { '#v': 'version' },
  }));

  if (!patient || patient.isDeleted) {
    console.log(JSON.stringify({
      action: patient && patient.isDeleted ? 'intake_patient_archived' : 'intake_patient_not_found',
      patientId: tokenRecord.patientId,
      timestamp: now,
    }));
    return fail(event, TOKEN_INVALID_MSG, 403);
  }

  const mergeResult = buildIntakeMerge(
    patient.formData,
    formData,
    patient.intakePendingOverrides
  );
  const pendingOverrideKeys = Object.keys(mergeResult.pendingOverrides);
  const nextFieldProvenance = updateFieldProvenance(
    patient.fieldProvenance,
    mergeResult.appliedFields,
    'patient-intake',
    'patient-intake',
    now
  );
  const nextPendingProvenance = updateFieldProvenance(
    filterPendingMetadata(patient.intakePendingProvenance, pendingOverrideKeys),
    pendingOverrideKeys,
    'patient-intake-pending',
    'patient-intake',
    now
  );
  const currentVersion = Number.isInteger(patient.version) ? patient.version : 1;
  const nextVersion = currentVersion + 1;
  const visitEntry = {
    date: now,
    user: 'patient-intake',
    action: 'Patient intake submitted',
  };
  const exprNames = {
    '#fd': 'formData',
    '#updatedAt': 'updatedAt',
    '#updatedBy': 'updatedBy',
    '#intakeStatus': 'intakeStatus',
    '#intakeReceivedAt': 'intakeReceivedAt',
    '#visits': 'visits',
    '#version': 'version',
    '#fieldProvenance': 'fieldProvenance',
    '#intakeAppliedFieldCount': 'intakeAppliedFieldCount',
    '#intakePendingFieldCount': 'intakePendingFieldCount',
    '#intakePendingOverrides': 'intakePendingOverrides',
    '#intakePendingProvenance': 'intakePendingProvenance',
  };
  const exprValues = {
    ':used': 'used',
    ':active': 'active',
    ':now': now,
    ':fd': mergeResult.mergedFormData,
    ':fieldProvenance': nextFieldProvenance,
    ':updatedBy': 'patient-intake',
    ':intakeStatus': pendingOverrideKeys.length ? 'review-needed' : 'received',
    ':visit': [visitEntry],
    ':emptyList': [],
    ':expectedVersion': currentVersion,
    ':nextVersion': nextVersion,
    ':appliedCount': mergeResult.appliedFields.length,
    ':pendingCount': pendingOverrideKeys.length,
  };
  const patientCondition = Number.isInteger(patient.version)
    ? 'attribute_exists(patientId) AND #version = :expectedVersion'
    : 'attribute_exists(patientId) AND attribute_not_exists(#version)';
  let patientUpdateExpression =
    'SET #fd = :fd, #fieldProvenance = :fieldProvenance, #updatedAt = :now, #updatedBy = :updatedBy, #intakeStatus = :intakeStatus, ' +
    '#intakeReceivedAt = :now, #visits = list_append(if_not_exists(#visits, :emptyList), :visit), ' +
    '#version = :nextVersion, #intakeAppliedFieldCount = :appliedCount, #intakePendingFieldCount = :pendingCount';

  if (pendingOverrideKeys.length) {
    exprValues[':pendingOverrides'] = mergeResult.pendingOverrides;
    exprValues[':pendingProvenance'] = nextPendingProvenance;
    patientUpdateExpression += ', #intakePendingOverrides = :pendingOverrides, #intakePendingProvenance = :pendingProvenance';
  } else {
    patientUpdateExpression += ' REMOVE #intakePendingOverrides, #intakePendingProvenance';
  }

  try {
    await ddb.send(new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: TOKEN_TABLE,
            Key: { tokenHash },
            UpdateExpression: 'SET #s = :used, usedAt = :now',
            ConditionExpression: '#s = :active',
            ExpressionAttributeNames: { '#s': 'status' },
            ExpressionAttributeValues: {
              ':used': 'used',
              ':active': 'active',
              ':now': now,
            },
          },
        },
        {
          Update: {
            TableName: PATIENT_TABLE,
            Key: { patientId: tokenRecord.patientId },
            UpdateExpression: patientUpdateExpression,
            ConditionExpression: patientCondition,
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: exprValues,
          },
        },
      ],
    }));
  } catch (err) {
    if (err.name === 'TransactionCanceledException' || err.name === 'ConditionalCheckFailedException') {
      console.log(JSON.stringify({
        action: 'intake_transaction_conflict',
        patientId: tokenRecord.patientId,
        timestamp: now,
      }));
      return fail(event, 'We could not save your responses. Please try again.', 409);
    }
    throw err;
  }

  // ── 7. Audit log (no PHI) ───────────────────────────────
  console.log(JSON.stringify({
    action: 'intake_submitted',
    patientId: tokenRecord.patientId,
    timestamp: now,
    fieldsReceived: Object.keys(formData).length,
    fieldsApplied: mergeResult.appliedFields.length,
    fieldsPendingReview: pendingOverrideKeys.length,
    // NO field values, NO patient name, NO token value
  }));

  return ok(event, {
    success: true,
    message: 'Thank you! Your responses have been received.',
  });
}
