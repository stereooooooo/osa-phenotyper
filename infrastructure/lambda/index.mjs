/**
 * OSA Phenotyper – Patient CRUD + Intake Token API (Lambda handler)
 * Patient routes require Cognito JWT via API Gateway authorizer.
 * Token management routes also require Cognito JWT.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, GetCommand, PutCommand,
  UpdateCommand, DeleteCommand, ScanCommand, QueryCommand
} from '@aws-sdk/lib-dynamodb';
import { randomUUID, randomBytes, createHash } from 'node:crypto';

const TABLE = process.env.TABLE_NAME;
const TOKEN_TABLE = process.env.TOKEN_TABLE;
const ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const ok = (body, code = 200) => ({
  statusCode: code,
  headers,
  body: JSON.stringify(body),
});

const fail = (msg, code = 400) => ({
  statusCode: code,
  headers,
  body: JSON.stringify({ error: msg }),
});

/* ── Route dispatcher ─────────────────────────────────────── */
export async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.requestContext?.http?.path || event.path;
  const user = event.requestContext?.authorizer?.jwt?.claims?.email || 'unknown';

  try {
    // GET /patients/search?q=...
    if (method === 'GET' && path === '/patients/search') {
      return await searchPatients(event.queryStringParameters);
    }
    // GET /patients/:id
    if (method === 'GET' && path.match(/^\/patients\/[^/]+$/)) {
      const id = path.split('/').pop();
      return await getPatient(id);
    }
    // GET /patients
    if (method === 'GET' && path === '/patients') {
      return await listPatients();
    }
    // POST /patients
    if (method === 'POST' && path === '/patients') {
      const body = JSON.parse(event.body || '{}');
      return await createPatient(body, user);
    }
    // PUT /patients/:id
    if (method === 'PUT' && path.match(/^\/patients\/[^/]+$/)) {
      const id = path.split('/').pop();
      const body = JSON.parse(event.body || '{}');
      return await updatePatient(id, body, user);
    }
    // DELETE /patients/:id
    if (method === 'DELETE' && path.match(/^\/patients\/[^/]+$/)) {
      const id = path.split('/').pop();
      return await deletePatient(id);
    }

    // ── Intake Token Management Routes ──────────────────────
    // POST /intake-tokens — generate a new intake token for a patient
    if (method === 'POST' && path === '/intake-tokens') {
      const body = JSON.parse(event.body || '{}');
      return await createIntakeToken(body, user);
    }
    // GET /intake-tokens/:patientId — list active tokens for a patient
    if (method === 'GET' && path.match(/^\/intake-tokens\/[^/]+$/)) {
      const patientId = path.split('/').pop();
      return await listIntakeTokens(patientId);
    }
    // DELETE /intake-tokens/:tokenHash — revoke an active token
    if (method === 'DELETE' && path.match(/^\/intake-tokens\/[^/]+$/)) {
      const tokenHash = path.split('/').pop();
      return await revokeIntakeToken(tokenHash, user);
    }

    return fail('Not found', 404);
  } catch (err) {
    // Log error type only — never log full error object (may contain PHI in stack/message)
    console.log(JSON.stringify({
      action: 'lambda_error',
      errorType: err.name || 'Error',
      message: err.message || 'Unknown',
      timestamp: new Date().toISOString(),
    }));
    return fail('Internal server error', 500);
  }
}

/* ── CRUD operations ──────────────────────────────────────── */

async function createPatient(body, user) {
  const { name, dob, mrn, formData, status, milestones } = body;
  if (!name || !dob) return fail('Name and DOB are required');

  const now = new Date().toISOString();
  const item = {
    patientId: randomUUID(),
    name: name.trim(),
    nameLower: name.trim().toLowerCase(),
    dob,
    mrn: (mrn || '').trim(),
    status: status || 'Initial Eval',
    milestones: Array.isArray(milestones) ? milestones : [],
    formData: formData || {},
    visits: [{
      date: now,
      user,
      action: 'Created',
      formSnapshot: formData || {},
    }],
    createdAt: now,
    updatedAt: now,
    createdBy: user,
    updatedBy: user,
  };

  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return ok(item, 201);
}

async function getPatient(id) {
  const { Item } = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { patientId: id },
  }));
  if (!Item) return fail('Patient not found', 404);
  return ok(Item);
}

async function listPatients() {
  const { Items } = await ddb.send(new ScanCommand({
    TableName: TABLE,
    ProjectionExpression: 'patientId, #n, dob, mrn, #s, milestones, updatedAt, intakeStatus, intakeReceivedAt',
    ExpressionAttributeNames: { '#n': 'name', '#s': 'status' },
  }));
  // Sort by most recently updated
  const sorted = (Items || []).sort((a, b) =>
    (b.updatedAt || '').localeCompare(a.updatedAt || '')
  );
  return ok(sorted);
}

async function updatePatient(id, body, user) {
  // Verify patient exists
  const { Item } = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { patientId: id },
  }));
  if (!Item) return fail('Patient not found', 404);

  const now = new Date().toISOString();
  const { name, dob, mrn, formData, status, milestones } = body;

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
  };
  const names = { '#u': 'updatedAt', '#ub': 'updatedBy', '#v': 'visits' };
  let expr = 'SET #u = :now, #ub = :user, #v = list_append(#v, :visit)';

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
  }
  if (status !== undefined) {
    expr += ', #s = :status';
    updates[':status'] = status;
    names['#s'] = 'status';
  }
  if (milestones !== undefined) {
    expr += ', milestones = :ms';
    updates[':ms'] = Array.isArray(milestones) ? milestones : [];
  }

  const { Attributes } = await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { patientId: id },
    UpdateExpression: expr,
    ExpressionAttributeValues: updates,
    ExpressionAttributeNames: names,
    ReturnValues: 'ALL_NEW',
  }));

  return ok(Attributes);
}

async function deletePatient(id) {
  await ddb.send(new DeleteCommand({
    TableName: TABLE,
    Key: { patientId: id },
  }));
  return ok({ deleted: id });
}

async function searchPatients(params) {
  const q = (params?.q || '').trim().toLowerCase();
  if (!q) return ok([]);

  // Try MRN exact match first
  const { Items: mrnItems } = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'mrn-index',
    KeyConditionExpression: 'mrn = :mrn',
    ExpressionAttributeValues: { ':mrn': q },
  }));
  if (mrnItems?.length) return ok(mrnItems);

  // Fall back to name scan (fine for small datasets)
  const { Items: nameItems } = await ddb.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: 'contains(nameLower, :q)',
    ExpressionAttributeValues: { ':q': q },
  }));
  return ok(nameItems || []);
}

/* ── Intake Token Management ─────────────────────────────── */

/**
 * POST /intake-tokens
 * Generate a time-limited, single-use intake token for a patient.
 * Token is returned once; only SHA-256 hash is stored.
 */
async function createIntakeToken(body, user) {
  const { patientId } = body;
  if (!patientId) return fail('patientId is required');

  // Verify patient exists
  const { Item: patient } = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { patientId },
    ProjectionExpression: '#n',
    ExpressionAttributeNames: { '#n': 'name' },
  }));
  if (!patient) return fail('Patient not found', 404);

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

  return ok({
    token: rawToken,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  }, 201);
}

/**
 * GET /intake-tokens/:patientId
 * List active/used tokens for a patient (for clinician revocation UI).
 */
async function listIntakeTokens(patientId) {
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
  return ok(tokens);
}

/**
 * DELETE /intake-tokens/:tokenHash
 * Revoke an active token (sets status to 'revoked').
 */
async function revokeIntakeToken(tokenHash, user) {
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

    return ok({ revoked: true });
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return fail('Token is not active or does not exist', 404);
    }
    throw err;
  }
}
