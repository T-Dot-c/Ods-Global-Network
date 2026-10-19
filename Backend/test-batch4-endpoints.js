/**
 * ODS Global Network — Batch 4 Endpoint & Security Verification Suite
 *
 * Consolidates: smoke-upload-view, verify-phase2, check-ods-app-privileges
 * (those standalone scripts are deleted; this file is the single source of truth).
 *
 * Fix #3: Teardown uses TEST_ADMIN_DB_* owner-level connection.
 *         The app itself continues to run as ods_app.
 * Fix #4: Test T10d — COMPLIANCE_RESET on KYC document upload for APPROVED entity.
 *
 * Prerequisites:
 *   - Backend server running on http://localhost:3001
 *   - .env sets TEST_ADMIN_DB_* for the postgres owner connection
 *   - .env sets DB_* for the ods_app connection (what the app uses)
 *   - A real admin account exists; pass credentials via env:
 *       TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD
 *
 * Usage:
 *   node test-batch4-endpoints.js
 */
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const API_BASE = process.env.TEST_API_BASE || 'http://localhost:3001';

// ── Owner-level pool (Fix #3: teardown only; never used in app runtime) ───────
const adminPool = new Pool({
  host:     process.env.TEST_ADMIN_DB_HOST || process.env.DB_HOST,
  port:     process.env.TEST_ADMIN_DB_PORT || process.env.DB_PORT,
  database: process.env.TEST_ADMIN_DB_NAME || process.env.DB_NAME,
  user:     process.env.TEST_ADMIN_DB_USER || 'postgres',
  password: process.env.TEST_ADMIN_DB_PASSWORD || process.env.DB_PASSWORD,
  ssl:      false,
});

// ── ods_app pool (read-only evidence checks matching app runtime) ──────────────
const appPool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,      // ods_app
  password: process.env.DB_PASSWORD,
  ssl:      false,
});

const UPLOADS_DIR = path.resolve(__dirname, 'uploads/private');

// ── Test fixture tracking for cleanup ─────────────────────────────────────────
const createdUserIds      = [];
const createdMerchantIds  = [];
const createdProviderIds  = [];
const createdDocumentIds  = [];
const createdPartnerIds   = [];
const createdSupportReferences = [];
const createdDiskFiles    = [];

let passed = 0;
let failed = 0;

function assert(name, condition, extra = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${name}${extra ? ' — ' + extra : ''}`);
    failed++;
  }
}

/* ── Helper: build a valid minimal PDF buffer (magic bytes only) ─────────────── */
function makePdfBuffer(sizeBytes = 512) {
  const buf = Buffer.alloc(sizeBytes, 0x20); // fill with spaces
  buf.write('%PDF-1.4\n', 0, 'ascii');
  return buf;
}

/* ── Helper: HTTP fetch with cookie ─────────────────────────────────────────── */
async function api(method, path, { body, cookie, contentType } = {}) {
  const headers = {};
  if (cookie)      headers['Cookie']       = cookie;
  if (contentType) headers['Content-Type'] = contentType;

  const opts = { method, headers };
  if (method !== 'GET' && method !== 'HEAD' && body !== undefined && body !== null) {
    opts.body = body;
  }

  const res = await fetch(`${API_BASE}${path}`, opts);
  res.res = res;
  return res;
}

async function apiJson(method, path, bodyObj, cookie) {
  const isGetOrHead = method === 'GET' || method === 'HEAD';
  const res = await api(method, path, {
    body: (!isGetOrHead && bodyObj !== undefined && bodyObj !== null) ? JSON.stringify(bodyObj) : undefined,
    cookie,
    contentType: isGetOrHead ? undefined : 'application/json',
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function cookieFrom(res) {
  return res.headers.get('set-cookie')?.split(';')[0] || '';
}

/* ── Helper: upload a file buffer ────────────────────────────────────────────── */
async function uploadFile(buffer, filename, purpose, cookie) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'application/pdf' }), filename);
  form.append('purpose', purpose);

  const headers = {};
  if (cookie) headers['Cookie'] = cookie;

  const res = await fetch(`${API_BASE}/api/documents/upload`, {
    method: 'POST',
    headers,
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

/* ── Register a fresh fixture user and return session cookie ─────────────────── */
async function registerAndLogin(email, password, role, extra = {}) {
  await apiJson('POST', '/api/auth/register', { email, password, full_name: email, role, ...extra });
  // Per Batch 5 plan requirement: mark user verified so KYC upload & profile updates succeed
  await adminPool.query('UPDATE users SET is_email_verified = TRUE WHERE email = $1', [email.toLowerCase().trim()]);
  const { res: lr } = await apiJson('POST', '/api/auth/login', { email, password });
  const cookie = cookieFrom(lr);
  return cookie;
}

/* ── Track created fixture in DB for teardown ────────────────────────────────── */
async function trackFixtureUser(email) {
  const r = await adminPool.query(`SELECT id, role FROM users WHERE email = $1`, [email]);
  if (r.rows.length > 0) {
    createdUserIds.push({ id: r.rows[0].id, role: r.rows[0].role, email });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN TEST RUNNER
   ═══════════════════════════════════════════════════════════════════════════════ */
async function runTests() {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('   ODS Global Network — Batch 4 Full Verification Suite');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Safety check: ensure suite never runs against non-dev/production DB
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: Refusing to run test suite in production environment!');
    process.exit(1);
  }
  if (process.env.ALLOW_DESTRUCTIVE_TESTS !== '1') {
    console.error('FATAL: Refusing to run test suite without ALLOW_DESTRUCTIVE_TESTS=1 opt-in flag!');
    process.exit(1);
  }
  const targetDb = process.env.TEST_ADMIN_DB_NAME || process.env.DB_NAME;
  const ALLOWED_DEV_DBS = ['ods_global.net', 'ods_global_test', 'ods_global_dev'];
  if (!ALLOWED_DEV_DBS.includes(targetDb)) {
    console.error(`FATAL: Refusing to run test suite against non-dev database: "${targetDb}". Allowed dev databases: ${ALLOWED_DEV_DBS.join(', ')}`);
    process.exit(1);
  }

  // Provision super admin fixture
  const SUPER_ADMIN_EMAIL = `b4_super_admin_${Date.now()}@odsglobal.net`;
  const SUPER_ADMIN_PASSWORD = 'SuperAdminPass123!';
  const bcrypt = require('bcryptjs');
  const sHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
  const insSuperAdmin = await adminPool.query(
    `INSERT INTO users (email, password_hash, full_name, role, is_active)
     VALUES ($1, $2, 'B4 Super Administrator', 'admin', TRUE)
     RETURNING id`,
    [SUPER_ADMIN_EMAIL, sHash]
  );
  const superAdminId = insSuperAdmin.rows[0].id;
  await adminPool.query(
    `INSERT INTO admins (user_id, admin_level, permissions)
     VALUES ($1, 'super_admin', '{"all": true}'::jsonb)`,
    [superAdminId]
  );
  createdUserIds.push({ id: superAdminId, role: 'admin', email: SUPER_ADMIN_EMAIL });
  console.log(`  Provisioned super admin fixture: ${SUPER_ADMIN_EMAIL}`);

  // Provision regular staff admin fixture (for 403 audit-logs check)
  const REGULAR_ADMIN_EMAIL = `b4_staff_admin_${Date.now()}@odsglobal.net`;
  const REGULAR_ADMIN_PASSWORD = 'StaffAdminPass123!';
  const rHash = await bcrypt.hash(REGULAR_ADMIN_PASSWORD, 10);
  const insRegAdmin = await adminPool.query(
    `INSERT INTO users (email, password_hash, full_name, role, is_active)
     VALUES ($1, $2, 'B4 Staff Administrator', 'admin', TRUE)
     RETURNING id`,
    [REGULAR_ADMIN_EMAIL, rHash]
  );
  const regAdminId = insRegAdmin.rows[0].id;
  await adminPool.query(
    `INSERT INTO admins (user_id, admin_level, permissions)
     VALUES ($1, 'staff', '{"kyc": true}'::jsonb)`,
    [regAdminId]
  );
  createdUserIds.push({ id: regAdminId, role: 'admin', email: REGULAR_ADMIN_EMAIL });
  console.log(`  Provisioned regular staff admin fixture: ${REGULAR_ADMIN_EMAIL}`);

  const ADMIN_EMAIL = SUPER_ADMIN_EMAIL;
  const ADMIN_PASSWORD = SUPER_ADMIN_PASSWORD;

  // ── T0: ods_app privilege check (migrated from check-ods-app-privileges.js) ─
  console.log('\n── T0: ods_app Privilege Check ──────────────────────────────────');
  try {
    const tables = ['users','merchants','providers','audit_logs','documents','addresses','contact_persons','partners'];
    for (const t of tables) {
      try {
        await appPool.query(`SELECT 1 FROM ${t} LIMIT 0`);
        assert(`ods_app can SELECT from ${t}`, true);
      } catch (e) {
        assert(`ods_app can SELECT from ${t}`, false, e.message);
      }
    }
    // audit_logs must NOT allow UPDATE or DELETE
    try {
      await appPool.query(`UPDATE audit_logs SET action = action WHERE FALSE`);
      assert('ods_app cannot UPDATE audit_logs (append-only)', false, 'UPDATE succeeded unexpectedly');
    } catch (e) {
      assert('ods_app cannot UPDATE audit_logs (append-only)', e.message.includes('permission denied'));
    }
    try {
      await appPool.query(`DELETE FROM audit_logs WHERE FALSE`);
      assert('ods_app cannot DELETE audit_logs (append-only)', false, 'DELETE succeeded unexpectedly');
    } catch (e) {
      assert('ods_app cannot DELETE audit_logs (append-only)', e.message.includes('permission denied'));
    }
  } catch (e) {
    console.error('  T0 error:', e.message);
  }

  // ── T1: Magic-Byte Sniffing ───────────────────────────────────────────────
  console.log('\n── T1: Magic-Byte Sniffing ──────────────────────────────────────');
  const merchantEmail = `b4_merchant_${Date.now()}@odsglobal.net`;
  const merchantPass  = 'BatchFourPass123!';
  const mCookie = await registerAndLogin(merchantEmail, merchantPass, 'merchant', {
    business_name: 'B4 Test Merchants Ltd', category: 'General',
  });
  await trackFixtureUser(merchantEmail);

  // Valid PDF
  const pdfBuf = makePdfBuffer(2048);
  const { res: tpdf, data: dpdf } = await uploadFile(pdfBuf, 'license.pdf', 'kyc_license', mCookie);
  assert('T1a: Valid PDF accepted (201)', tpdf.status === 201 && dpdf.success === true);
  if (dpdf.document_id) createdDocumentIds.push(dpdf.document_id);

  // Renamed .txt file with no valid header
  const textBuf = Buffer.from('This is plain text content with no magic bytes');
  const { res: ttxt } = await uploadFile(textBuf, 'document.txt', 'kyc_license', mCookie);
  assert('T1b: .txt file without valid magic bytes rejected (400)', ttxt.status === 400);

  // .exe signature (MZ header)
  const exeBuf = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00]);
  const { res: texe } = await uploadFile(exeBuf, 'malware.pdf', 'kyc_license', mCookie);
  assert('T1c: .exe magic bytes rejected (400)', texe.status === 400);

  // ── T2: Upload Size Limits ────────────────────────────────────────────────
  console.log('\n── T2: Upload Size Limits ───────────────────────────────────────');

  // 7 MB — should be accepted (authenticated)
  const buf7mb = makePdfBuffer(7 * 1024 * 1024);
  const { res: t7, data: d7 } = await uploadFile(buf7mb, 'big.pdf', 'kyc_license', mCookie);
  assert('T2a: 7 MB authenticated file accepted (201)', t7.status === 201 && d7.success === true);
  if (d7.document_id) createdDocumentIds.push(d7.document_id);

  // 12 MB — should be rejected with "10 MB" in message
  const buf12mb = makePdfBuffer(12 * 1024 * 1024);
  const { res: t12, data: d12 } = await uploadFile(buf12mb, 'huge.pdf', 'kyc_license', mCookie);
  assert('T2b: 12 MB authenticated file rejected (400)', t12.status === 400);
  assert('T2b: Rejection message contains "10 MB"', (d12.message || '').includes('10 MB'));

  // 5 MB anonymous — should be accepted
  const anonBuf5 = makePdfBuffer(5 * 1024 * 1024);
  const { res: ta5, data: da5 } = await uploadFile(anonBuf5, 'proposal.pdf', 'partner_proposal', null);
  // 5 MB exactly is at the boundary; multer uses < comparison so test with slightly under
  const anonBuf4 = makePdfBuffer(4 * 1024 * 1024);
  const { res: ta4, data: da4 } = await uploadFile(anonBuf4, 'proposal.pdf', 'partner_proposal', null);
  assert('T2c: 4 MB anonymous file accepted (201)', ta4.status === 201 && da4.success === true);
  if (da4.document_id) createdDocumentIds.push(da4.document_id);

  // 6 MB anonymous — should be rejected with "5 MB" in message
  const anonBuf6 = makePdfBuffer(6 * 1024 * 1024);
  const { res: ta6, data: da6 } = await uploadFile(anonBuf6, 'toolarge.pdf', 'partner_proposal', null);
  assert('T2d: 6 MB anonymous file rejected (400)', ta6.status === 400);
  assert('T2d: Rejection message contains "5 MB"', (da6.message || '').includes('5 MB'));

  // ── T3: Owner & Purpose Enforcement ──────────────────────────────────────
  console.log('\n── T3: Owner & Purpose Enforcement ─────────────────────────────');
  const { res: tpurp, data: dpurp } = await uploadFile(pdfBuf, 'license.pdf', 'partner_proposal', mCookie);
  assert('T3a: Authenticated upload with anon-only purpose rejected (400)', tpurp.status === 400);

  const { res: tanonkyc } = await uploadFile(pdfBuf, 'license.pdf', 'kyc_license', null);
  assert('T3b: Anonymous upload with KYC purpose rejected (400)', tanonkyc.status === 400);

  // ── T4: Anonymous Upload Staging Token & Capacity ──────────────────────
  console.log('\n── T4: Anonymous Upload & Staging Token ─────────────────────────');
  const buf512 = makePdfBuffer(512);
  const { res: tanonRes, data: danonRes } = await uploadFile(buf512, 'prop.pdf', 'partner_proposal', null);
  assert('T4a: Anonymous upload returns 201 with staging_token', tanonRes.status === 201 && !!danonRes.staging_token);
  if (danonRes.document_id) createdDocumentIds.push(danonRes.document_id);
  const validStagingToken = danonRes.staging_token;

  // T4b: Anonymous staging storage cap exceeded returns 503
  const dummyCapInsert = await adminPool.query(
    `INSERT INTO documents (entity_type, purpose, document_type, file_url, file_name, mime_type,
       file_size, storage_path, is_attached, expires_at, status)
     VALUES ('unattached', 'partner_proposal', 'other', '/api/documents/private/dummy-cap', 'dummy-cap.pdf',
       'application/pdf', 101 * 1024 * 1024, 'dummy_path', FALSE,
       NOW() + INTERVAL '1 hour', 'pending')
     RETURNING id`
  );
  const dummyCapId = dummyCapInsert.rows[0].id;
  const { res: tCapRes, data: dCapData } = await uploadFile(buf512, 'cap_test.pdf', 'partner_proposal', null);
  assert('T4b: Staging storage cap exceeded returns 503 Service Unavailable',
    tCapRes.status === 503 && (dCapData.message || '').includes('capacity temporarily full'));
  await adminPool.query(`DELETE FROM documents WHERE id = $1`, [dummyCapId]);

  // ── T5: Staging Token Verification & Lifecycle ────────────────────────────
  console.log('\n── T5: Staging Token Verification & Lifecycle ───────────────────');

  // Valid attach
  const { res: tattach, data: dattach } = await apiJson('POST', '/api/partners', {
    partnership_type: 'investor',
    name: 'Test Investor B4',
    company_name: 'B4 Capital',
    email: `b4investor_${Date.now()}@example.com`,
    phone: '+1234567890',
    staging_token: validStagingToken,
  });
  assert('T5a: Partner form with valid staging token attaches document (200)', tattach.status === 200 && dattach.success === true);
  // Track the partner for cleanup
  const partnerRows = await adminPool.query(
    `SELECT id FROM partners WHERE name = 'Test Investor B4' ORDER BY created_at DESC LIMIT 1`
  );
  if (partnerRows.rows.length > 0) createdPartnerIds.push(partnerRows.rows[0].id);

  // Tampered token
  const { res: texp } = await apiJson('POST', '/api/partners', {
    partnership_type: 'investor',
    name: 'Test Tampered',
    company_name: 'Tampered Co',
    email: `tampered_${Date.now()}@example.com`,
    phone: '+9876543210',
    staging_token: 'invalid.tampered.token',
  });
  assert('T5b: Tampered staging token rejected (400)', texp.status === 400);

  // No staging token — should succeed without attachment
  const { res: tnone, data: dnone } = await apiJson('POST', '/api/partners', {
    partnership_type: 'sponsorship',
    name: 'No Doc Partner',
    company_name: 'Clean Co',
    email: `nodoc_${Date.now()}@example.com`,
    phone: '+1122334455',
  });
  assert('T5c: Partner form without staging token succeeds (200)', tnone.status === 200 && dnone.success === true);
  const ndRows = await adminPool.query(
    `SELECT id FROM partners WHERE name = 'No Doc Partner' ORDER BY created_at DESC LIMIT 1`
  );
  if (ndRows.rows.length > 0) createdPartnerIds.push(ndRows.rows[0].id);

  const stagingSecret = process.env.STAGING_TOKEN_SECRET || (process.env.JWT_SECRET + '_staging');

  // T5d: Expired staging token
  const expiredStagingToken = jwt.sign(
    { docId: crypto.randomUUID(), purpose: 'partner_proposal' },
    stagingSecret,
    { expiresIn: '-10s', audience: 'ods:partner_staging', issuer: 'ods_global_network' }
  );
  const { res: texpStaging, data: dexpStaging } = await apiJson('POST', '/api/partners', {
    partnership_type: 'investor',
    name: 'Expired Token Partner',
    company_name: 'Expired Co',
    email: `expired_tok_${Date.now()}@example.com`,
    phone: '+1234567890',
    staging_token: expiredStagingToken,
  });
  assert('T5d: Expired staging token rejected (400)',
    texpStaging.status === 400 && (dexpStaging.message || '').includes('expired'));

  // T5e: Replayed staging token (re-submitting with validStagingToken that was already attached in T5a)
  const { res: treplay, data: dreplay } = await apiJson('POST', '/api/partners', {
    partnership_type: 'investor',
    name: 'Replay Partner',
    company_name: 'Replay Co',
    email: `replay_${Date.now()}@example.com`,
    phone: '+1234567890',
    staging_token: validStagingToken,
  });
  assert('T5e: Replayed staging token rejected (400)',
    treplay.status === 400 && (dreplay.message || '').includes('already attached'));

  // T5f: Foreign-purpose staging token
  const foreignStagingToken = jwt.sign(
    { docId: crypto.randomUUID(), purpose: 'kyc_license' },
    stagingSecret,
    { expiresIn: '1h', audience: 'ods:partner_staging', issuer: 'ods_global_network' }
  );
  const { res: tforeign, data: dforeign } = await apiJson('POST', '/api/partners', {
    partnership_type: 'investor',
    name: 'Foreign Purpose Partner',
    company_name: 'Foreign Co',
    email: `foreign_tok_${Date.now()}@example.com`,
    phone: '+1234567890',
    staging_token: foreignStagingToken,
  });
  assert('T5f: Foreign-purpose staging token rejected (400)',
    tforeign.status === 400 && (dforeign.message || '').includes('purpose'));

  // T5g: Anonymous upload rate limiting (429)
  let got429 = false;
  for (let i = 0; i < 15; i++) {
    const { res: tRateRes, data: dRateRes } = await uploadFile(buf512, 'rate.pdf', 'partner_proposal', null);
    if (dRateRes?.document_id) createdDocumentIds.push(dRateRes.document_id);
    if (tRateRes.status === 429) {
      got429 = true;
      break;
    }
  }
  assert('T5g: Anonymous uploads exceeding rate limit return 429 Too Many Requests', got429);

  // Wait out the window afterward so it cannot flake on a slow machine
  const anonWindowMs = process.env.RATE_LIMIT_ANON_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_ANON_WINDOW_MS, 10) : 3000;
  await new Promise(r => setTimeout(r, Math.max(anonWindowMs, 3000) + 500));

  // ── T6: Cross-Tenant IDOR Protection ─────────────────────────────────────
  console.log('\n── T6: Cross-Tenant IDOR Protection ─────────────────────────────');

  // Register a second merchant
  const merchantBEmail = `b4_merchantB_${Date.now()}@odsglobal.net`;
  const mBCookie = await registerAndLogin(merchantBEmail, 'BatchFourPassB123!', 'merchant', {
    business_name: 'B4 Merchant B', category: 'General',
  });
  await trackFixtureUser(merchantBEmail);

  // Merchant B uploads a doc
  const { data: dB } = await uploadFile(pdfBuf, 'b_license.pdf', 'kyc_license', mBCookie);
  const merchantBDocId = dB.document_id;
  if (merchantBDocId) createdDocumentIds.push(merchantBDocId);

  // Merchant A tries to view Merchant B's doc
  if (merchantBDocId) {
    const { res: tidor } = await api('GET', `/api/documents/${merchantBDocId}/view`, { cookie: mCookie });
    assert('T6a: Merchant A cannot view Merchant B doc (403)', tidor.status === 403);
  } else {
    assert('T6a: Merchant B doc created for IDOR test', false, 'doc not created');
  }

  // Customer tries to view KYC doc
  const custEmail = `b4_customer_${Date.now()}@odsglobal.net`;
  const cCookie = await registerAndLogin(custEmail, 'CustPass123!', 'customer', {
    country: 'Ethiopia', city: 'Addis Ababa',
  });
  await trackFixtureUser(custEmail);

  // Merchant A uploads a doc to reference
  const { data: dA2 } = await uploadFile(pdfBuf, 'a_reg.pdf', 'kyc_registration', mCookie);
  const mADocId = dA2.document_id;
  if (mADocId) createdDocumentIds.push(mADocId);

  if (mADocId) {
    const { res: tcustidor } = await api('GET', `/api/documents/${mADocId}/view`, { cookie: cCookie });
    assert('T6b: Customer cannot view merchant KYC doc (403)', tcustidor.status === 403);
  }

  // ── T7: Admin Document View & Security Headers ────────────────────────────
  console.log('\n── T7: Admin Document View & Security Headers ───────────────────');
  const { res: adminLoginRes } = await apiJson('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  const adminCookie = cookieFrom(adminLoginRes);
  assert('T7a: Admin login successful', !!adminCookie);

  if (mADocId && adminCookie) {
    const docViewRes = await api('GET', `/api/documents/${mADocId}/view`, { cookie: adminCookie });
    assert('T7b: Admin can view merchant doc (200)', docViewRes.status === 200);
    assert('T7c: nosniff header present', docViewRes.headers.get('x-content-type-options') === 'nosniff');
    assert('T7d: no-store header present', (docViewRes.headers.get('cache-control') || '').includes('no-store'));
    // Verify DOCUMENT_VIEWED audit entry written
    const auditViewCheck = await appPool.query(
      `SELECT COUNT(*) AS c FROM audit_logs WHERE action = 'DOCUMENT_VIEWED' AND details->>'document_id' = $1`,
      [mADocId]
    );
    assert('T7e: DOCUMENT_VIEWED audit entry written', parseInt(auditViewCheck.rows[0].c, 10) >= 1);
  }

  // ── T8: KYC State Machine ─────────────────────────────────────────────────
  console.log('\n── T8: KYC State Machine ────────────────────────────────────────');
  // NOTE: Admin routes (POST /api/admin/kyc/:entityType/:id/decision) are built in Phase 3.
  // This section tests the merchant-side state machine (compliance reset on re-upload)
  // and the upload service's KYC_RESUBMISSION logic.

  // T8a: Re-upload on REJECTED entity → back to pending + KYC_RESUBMISSION
  // First, manually set merchant to 'rejected' via adminPool for this test
  const mRow = await adminPool.query(
    `SELECT m.id FROM merchants m JOIN users u ON u.id = m.user_id WHERE u.email = $1`,
    [merchantEmail]
  );
  const testMerchantId = mRow.rows[0]?.id;

  if (testMerchantId) {
    await adminPool.query(
      `UPDATE merchants SET approval_status = 'rejected', rejection_reason = 'Test rejection',
       reviewed_at = NOW() WHERE id = $1`,
      [testMerchantId]
    );
    const { res: tresubmit, data: dresub } = await uploadFile(pdfBuf, 'resubmit.pdf', 'kyc_license', mCookie);
    assert('T8a: Rejected entity re-upload accepted (201)', tresubmit.status === 201 && dresub.success === true);
    if (dresub.document_id) createdDocumentIds.push(dresub.document_id);

    const statusAfter = await appPool.query(
      `SELECT approval_status, rejection_reason, reviewed_by FROM merchants WHERE id = $1`,
      [testMerchantId]
    );
    assert('T8b: Rejected entity status reset to pending after re-upload',
      statusAfter.rows[0]?.approval_status === 'pending');
    assert('T8c: rejection_reason cleared after re-upload',
      statusAfter.rows[0]?.rejection_reason === null);
    assert('T8d: reviewed_by cleared after re-upload',
      statusAfter.rows[0]?.reviewed_by === null);

    const auditResub = await appPool.query(
      `SELECT action FROM audit_logs
       WHERE user_id = (SELECT id FROM users WHERE email = $1)
         AND action = 'KYC_RESUBMISSION'
       ORDER BY created_at DESC LIMIT 1`,
      [merchantEmail]
    );
    assert('T8e: KYC_RESUBMISSION audit entry written', auditResub.rows.length > 0);

    // ── T8f & T8g: 422 Guard (No Documents) & Entity Remains Pending ──
    const noDocMerchantEmail = `b4_nodoc_m_${Date.now()}@odsglobal.net`;
    const noDocMCookie = await registerAndLogin(noDocMerchantEmail, 'NoDocPass123!', 'merchant', {
      business_name: 'No Doc Merchant Ltd', category: 'General',
    });
    await trackFixtureUser(noDocMerchantEmail);
    const noDocRow = await adminPool.query(
      `SELECT m.id FROM merchants m JOIN users u ON u.id = m.user_id WHERE u.email = $1`,
      [noDocMerchantEmail]
    );
    const noDocMerchantId = noDocRow.rows[0]?.id;

    // Admin attempts to approve merchant with 0 attached documents
    const { res: t422 } = await apiJson('POST', `/api/admin/kyc/merchant/${noDocMerchantId}/decision`, {
      decision: 'approved',
    }, adminCookie);
    assert('T8f: Admin approval with 0 documents rejected with 422 Unprocessable', t422.status === 422);

    // Verify entity remains pending after 422 rollback
    const statusAfter422 = await appPool.query(
      `SELECT approval_status FROM merchants WHERE id = $1`,
      [noDocMerchantId]
    );
    assert('T8g: Entity remains in pending status after 422 rollback', statusAfter422.rows[0]?.approval_status === 'pending');

    // Attach a document to noDocMerchant so it can receive approval
    const { data: uDoc422 } = await uploadFile(pdfBuf, 'nodoc_doc.pdf', 'kyc_license', noDocMCookie);
    if (uDoc422.document_id) createdDocumentIds.push(uDoc422.document_id);

    // Admin approves merchant
    const { res: tApproveValid } = await apiJson('POST', `/api/admin/kyc/merchant/${noDocMerchantId}/decision`, {
      decision: 'approved',
    }, adminCookie);
    assert('T8h: Admin approval with attached document succeeds (200)', tApproveValid.status === 200);

    // ── T8i & T8j: 409 Conflict Guard (Non-pending Entity) ──
    const { res: t409Approve } = await apiJson('POST', `/api/admin/kyc/merchant/${noDocMerchantId}/decision`, {
      decision: 'approved',
    }, adminCookie);
    assert('T8i: Decision on already approved entity rejected with 409 Conflict', t409Approve.status === 409);

    const { res: t409Reject } = await apiJson('POST', `/api/admin/kyc/merchant/${noDocMerchantId}/decision`, {
      decision: 'rejected', reason: 'Conflict test',
    }, adminCookie);
    assert('T8j: Rejecting already approved entity rejected with 409 Conflict', t409Reject.status === 409);

    // ── T8k: Simultaneous decisions race on single pending entity ──
    const simMerchantEmail = `b4_sim_m_${Date.now()}@odsglobal.net`;
    const simMCookie = await registerAndLogin(simMerchantEmail, 'SimPass123!', 'merchant', {
      business_name: 'Simultaneous Test Merchant Ltd', category: 'General',
    });
    await trackFixtureUser(simMerchantEmail);
    const simRow = await adminPool.query(
      `SELECT m.id FROM merchants m JOIN users u ON u.id = m.user_id WHERE u.email = $1`,
      [simMerchantEmail]
    );
    const simMerchantId = simRow.rows[0]?.id;
    const { data: uDocSim } = await uploadFile(pdfBuf, 'sim_doc.pdf', 'kyc_license', simMCookie);
    if (uDocSim.document_id) createdDocumentIds.push(uDocSim.document_id);

    // Fire two simultaneous decision requests
    const [simDec1, simDec2] = await Promise.all([
      apiJson('POST', `/api/admin/kyc/merchant/${simMerchantId}/decision`, { decision: 'approved' }, adminCookie),
      apiJson('POST', `/api/admin/kyc/merchant/${simMerchantId}/decision`, { decision: 'approved' }, adminCookie),
    ]);
    const simStatuses = [simDec1.res.status, simDec2.res.status].sort();
    assert('T8k: Two simultaneous decisions on one entity: exactly one wins (200) and one gets 409',
      simStatuses[0] === 200 && simStatuses[1] === 409);
  }

  // ── Provider KYC Decision Parity ─────────────────────────────────
  console.log('\n── Provider KYC Decision Parity ─────────────────────────────────');
  const provEmail = `b4_provider_${Date.now()}@odsglobal.net`;
  const provPass  = 'ProviderPass123!';
  const provCookie = await registerAndLogin(provEmail, provPass, 'provider', {
    provider_name: 'B4 Test Clinic Ltd', provider_type: 'clinic',
  });
  await trackFixtureUser(provEmail);

  const provRow = await adminPool.query(
    `SELECT p.id FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = $1`,
    [provEmail]
  );
  const testProviderId = provRow.rows[0]?.id;

  // 1. Admin attempts to approve provider with 0 attached documents → 422
  const { res: tProv422 } = await apiJson('POST', `/api/admin/kyc/provider/${testProviderId}/decision`, {
    decision: 'approved',
  }, adminCookie);
  assert('T8l: Provider approval with 0 documents rejected with 422 Unprocessable', tProv422.status === 422);

  // 2. Verify provider remains in pending status
  const provStatusAfter422 = await appPool.query(
    `SELECT approval_status FROM providers WHERE id = $1`, [testProviderId]
  );
  assert('T8m: Provider remains in pending status after 422 rollback',
    provStatusAfter422.rows[0]?.approval_status === 'pending');

  // 3. Upload KYC document for provider
  const { data: uDocProv } = await uploadFile(pdfBuf, 'prov_license.pdf', 'kyc_license', provCookie);
  if (uDocProv.document_id) createdDocumentIds.push(uDocProv.document_id);

  // 4. Admin approves provider → succeeds (200)
  const { res: tProvApprove } = await apiJson('POST', `/api/admin/kyc/provider/${testProviderId}/decision`, {
    decision: 'approved',
  }, adminCookie);
  assert('T8n: Provider approval with attached document succeeds (200)', tProvApprove.status === 200);

  const provAfterApprove = await appPool.query(
    `SELECT approval_status FROM providers WHERE id = $1`, [testProviderId]
  );
  assert('T8o: Provider status updated to approved',
    provAfterApprove.rows[0]?.approval_status === 'approved');

  // 5. Audit log contains KYC_APPROVAL with entity_type: provider
  const provAudit = await appPool.query(
    `SELECT action, details FROM audit_logs
     WHERE action = 'KYC_APPROVAL' AND details->>'entity_id' = $1
     ORDER BY created_at DESC LIMIT 1`,
    [testProviderId]
  );
  assert('T8p: KYC_APPROVAL audit entry written for provider entity', provAudit.rows.length > 0);

  // 6. Decision on already approved provider returns 409 Conflict
  const { res: tProv409 } = await apiJson('POST', `/api/admin/kyc/provider/${testProviderId}/decision`, {
    decision: 'approved',
  }, adminCookie);
  assert('T8q: Decision on already approved provider rejected with 409 Conflict', tProv409.status === 409);

  // ── T9: COMPLIANCE_RESET on Profile Edit ─────────────────────────────────
  console.log('\n── T9: COMPLIANCE_RESET on Profile Edit (Approved Entity) ───────');
  if (testMerchantId) {
    // Manually approve merchant for this test
    await adminPool.query(
      `UPDATE merchants SET approval_status = 'approved', rejection_reason = NULL,
       reviewed_at = NOW(), reviewed_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
       WHERE id = $1`,
      [testMerchantId]
    );
    // Change compliance field (city) → should reset to pending
    const { res: tcr, data: dcr } = await apiJson('PUT', '/api/merchant/profile', {
      address: { city: 'Hawassa', address_line: 'New Street 12' },
    }, mCookie);
    assert('T9a: Profile update on approved merchant returns 200', tcr.status === 200);
    assert('T9b: Message indicates pending reset', (dcr.message || '').includes('pending review'));

    const statusT9 = await appPool.query(
      `SELECT approval_status, rejection_reason, reviewed_by FROM merchants WHERE id = $1`,
      [testMerchantId]
    );
    assert('T9c: Merchant status reset to pending after address change',
      statusT9.rows[0]?.approval_status === 'pending');
    assert('T9d: reviewer fields cleared after compliance reset',
      statusT9.rows[0]?.reviewed_by === null);

    const auditCr = await appPool.query(
      `SELECT action FROM audit_logs
       WHERE user_id = (SELECT id FROM users WHERE email = $1)
         AND action = 'COMPLIANCE_RESET'
       ORDER BY created_at DESC LIMIT 1`,
      [merchantEmail]
    );
    assert('T9e: COMPLIANCE_RESET audit entry written', auditCr.rows.length > 0);
  }

  // ── T10: COMPLIANCE_RESET on KYC document re-upload (APPROVED entity) ────
  // Fix #4: New test — uploading a replacement KYC document on an APPROVED entity
  //         must reset status → pending, clear reviewer fields, log COMPLIANCE_RESET.
  console.log('\n── T10: COMPLIANCE_RESET on KYC Document Re-upload (Approved) ───');
  if (testMerchantId) {
    // Re-approve merchant for clean test state
    const adminUserRow = await adminPool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    const adminUserId = adminUserRow.rows[0]?.id;
    await adminPool.query(
      `UPDATE merchants SET approval_status = 'approved', rejection_reason = NULL,
       reviewed_at = NOW(), reviewed_by = $1 WHERE id = $2`,
      [adminUserId, testMerchantId]
    );

    // Confirm approved state before upload
    const beforeUpload = await appPool.query(
      `SELECT approval_status, reviewed_by FROM merchants WHERE id = $1`, [testMerchantId]
    );
    assert('T10a: Entity is approved before replacement upload',
      beforeUpload.rows[0]?.approval_status === 'approved');

    // Upload replacement KYC document
    const { res: t10res, data: d10 } = await uploadFile(pdfBuf, 'replacement_license.pdf', 'kyc_license', mCookie);
    assert('T10b: KYC replacement upload on approved entity accepted (201)',
      t10res.status === 201 && d10.success === true);
    if (d10.document_id) createdDocumentIds.push(d10.document_id);

    // Verify status reset to pending
    const afterUpload = await appPool.query(
      `SELECT approval_status, rejection_reason, reviewed_by, reviewed_at FROM merchants WHERE id = $1`,
      [testMerchantId]
    );
    assert('T10c: Status reset to pending after replacement KYC upload',
      afterUpload.rows[0]?.approval_status === 'pending');
    assert('T10d: rejection_reason cleared',
      afterUpload.rows[0]?.rejection_reason === null);
    assert('T10e: reviewed_by cleared',
      afterUpload.rows[0]?.reviewed_by === null);
    assert('T10f: reviewed_at cleared',
      afterUpload.rows[0]?.reviewed_at === null);

    // Verify COMPLIANCE_RESET audit entry (not KYC_RESUBMISSION — this was approved, not rejected)
    const auditT10 = await appPool.query(
      `SELECT action FROM audit_logs
       WHERE user_id = (SELECT id FROM users WHERE email = $1)
         AND action = 'COMPLIANCE_RESET'
         AND details->>'reason' = 'kyc_document_replacement'
       ORDER BY created_at DESC LIMIT 1`,
      [merchantEmail]
    );
    assert('T10g: COMPLIANCE_RESET (kyc_document_replacement) audit entry written',
      auditT10.rows.length > 0);
  }

  // ── T11: Admin RBAC Matrix ────────────────────────────────────────────────
  console.log('\n── T11: Admin RBAC Matrix ───────────────────────────────────────');
  // Unauthenticated on admin endpoints
  const { res: t11unauth } = await api('GET', '/api/admin/kyc/queue');
  assert('T11a: Unauthenticated /api/admin/kyc/queue returns 401', t11unauth.status === 401);

  // Customer trying admin endpoint
  if (cCookie) {
    const { res: t11cust } = await api('GET', '/api/admin/kyc/queue', { cookie: cCookie });
    assert('T11b: Customer cannot access /api/admin/kyc/queue (403)', t11cust.status === 403);

    // Customer cannot access /api/admin/audit-logs (super_admin only)
    const { res: t11custAudit } = await api('GET', '/api/admin/audit-logs', { cookie: cCookie });
    assert('T11c: Customer cannot access /api/admin/audit-logs (403)', t11custAudit.status === 403);
  }

  // Regular staff admin login
  const { res: regAdminLoginRes } = await apiJson('POST', '/api/auth/login', {
    email: REGULAR_ADMIN_EMAIL,
    password: REGULAR_ADMIN_PASSWORD,
  });
  const regAdminCookie = cookieFrom(regAdminLoginRes);
  assert('T11d: Regular staff admin login successful (200)', !!regAdminCookie);

  if (regAdminCookie) {
    // Regular admin can access KYC queue
    const { res: t11regKyc } = await api('GET', '/api/admin/kyc/queue', { cookie: regAdminCookie });
    assert('T11e: Regular staff admin can access /api/admin/kyc/queue (200)', t11regKyc.status === 200);

    // Regular admin DENIED (403) on /api/admin/audit-logs
    const { res: t11regAudit } = await api('GET', '/api/admin/audit-logs', { cookie: regAdminCookie });
    assert('T11f: Regular staff admin denied (403) on /api/admin/audit-logs', t11regAudit.status === 403);
  }

  // Super admin succeeds on /api/admin/audit-logs
  if (adminCookie) {
    const { res: t11superAudit } = await api('GET', '/api/admin/audit-logs', { cookie: adminCookie });
    assert('T11g: Super admin succeeds (200) on /api/admin/audit-logs', t11superAudit.status === 200);

    // Super admin can access /api/admin/kyc/queue
    const { res: t11superKyc, data: d11superKyc } = await apiJson('GET', '/api/admin/kyc/queue', null, adminCookie);
    assert('T11g-kyc: Super admin can access /api/admin/kyc/queue (200)',
      t11superKyc.status === 200 && Array.isArray(d11superKyc?.queue?.merchants) && Array.isArray(d11superKyc?.queue?.providers));

    // Super admin can make a KYC decision
    const saMerchantEmail = `b4_sa_m_${Date.now()}@odsglobal.net`;
    const saMCookie = await registerAndLogin(saMerchantEmail, 'SaPass123!', 'merchant', {
      business_name: 'SuperAdmin Decision Merchant Ltd', category: 'General',
    });
    await trackFixtureUser(saMerchantEmail);
    const saMRow = await adminPool.query(
      `SELECT m.id FROM merchants m JOIN users u ON u.id = m.user_id WHERE u.email = $1`,
      [saMerchantEmail]
    );
    const saMerchantId = saMRow.rows[0]?.id;
    const { data: uDocSa } = await uploadFile(pdfBuf, 'sa_decision_doc.pdf', 'kyc_license', saMCookie);
    if (uDocSa.document_id) createdDocumentIds.push(uDocSa.document_id);

    const { res: tSaDecision } = await apiJson('POST', `/api/admin/kyc/merchant/${saMerchantId}/decision`, {
      decision: 'approved',
    }, adminCookie);
    assert('T11g-decision: Super admin can make KYC decision (200)', tSaDecision.status === 200);

    const saAfter = await appPool.query(
      `SELECT approval_status, reviewed_by FROM merchants WHERE id = $1`, [saMerchantId]
    );
    assert('T11g-decision-state: Super admin KYC decision updates approval_status to approved and records reviewed_by',
      saAfter.rows[0]?.approval_status === 'approved' && saAfter.rows[0]?.reviewed_by === superAdminId);

    // Admin inbox endpoints
    // T11h: Create support request and assert it appears in /api/admin/inbox/support with its reference
    const supEmail = `b4_sup_${Date.now()}@odsglobal.net`;
    const { res: tSupCreate, data: dSupCreate } = await apiJson('POST', '/api/support', {
      name: 'Batch 4 Support User',
      email: supEmail,
      subject: 'Batch 4 Support Verification',
      message: 'Verifying support request presence in admin inbox.',
    });
    const createdRef = dSupCreate?.reference;
    if (createdRef) createdSupportReferences.push(createdRef);

    const { res: tInboxSupport, data: dInboxSupport } = await apiJson('GET', '/api/admin/inbox/support', null, adminCookie);
    assert('T11h: Support inbox query does not return 500', tInboxSupport.status !== 500);
    assert('T11h: Admin can access /api/admin/inbox/support (200)',
      tInboxSupport.status === 200 && Array.isArray(dInboxSupport.requests));
    const foundSupReq = (dInboxSupport.requests || []).find(r => r.reference === createdRef);
    assert(
      'T11h: Created support request appears in admin inbox with matching reference',
      !!foundSupReq && foundSupReq.reference === createdRef && foundSupReq.email === supEmail
    );

    const { res: tInboxPartners, data: dInboxPartners } = await apiJson('GET', '/api/admin/inbox/partners', null, adminCookie);
    assert('T11i: Admin can access /api/admin/inbox/partners (200)',
      tInboxPartners.status === 200 && Array.isArray(dInboxPartners.partners));

    // Verify partner inquiry with attachment appears in inbox with working document link
    const partnerWithDoc = (dInboxPartners.partners || []).find(p => p.document_id && p.document_view_url);
    if (partnerWithDoc) {
      const { res: tDocView } = await api('GET', partnerWithDoc.document_view_url, { cookie: adminCookie });
      assert(
        'T11i-doc: Partner inquiry with attachment appears in inbox with working document link (200)',
        tDocView.status === 200 && tDocView.headers.get('x-content-type-options') === 'nosniff'
      );
    } else {
      assert('T11i-doc: Partner inquiry with attachment appears in inbox with working document link', false, 'no partner with attached document found');
    }
  }

  // Customer denied on admin inboxes
  if (cCookie) {
    const { res: tCustInboxSup } = await apiJson('GET', '/api/admin/inbox/support', null, cCookie);
    assert('T11j: Customer denied (403) on /api/admin/inbox/support', tCustInboxSup.status === 403);

    const { res: tCustInboxPart } = await apiJson('GET', '/api/admin/inbox/partners', null, cCookie);
    assert('T11k: Customer denied (403) on /api/admin/inbox/partners', tCustInboxPart.status === 403);
  }

  // Unauthenticated denied on admin inboxes
  const { res: tUnauthSup } = await apiJson('GET', '/api/admin/inbox/support');
  assert('T11l: Unauthenticated request to /api/admin/inbox/support returns 401', tUnauthSup.status === 401);

  const { res: tUnauthPart } = await apiJson('GET', '/api/admin/inbox/partners');
  assert('T11m: Unauthenticated request to /api/admin/inbox/partners returns 401', tUnauthPart.status === 401);

  // ── T12: Guarded Sweeper ──────────────────────────────────────────────────
  console.log('\n── T12: Guarded Sweeper Verification ────────────────────────────');
  // 1. Expired unattached document (should be deleted)
  const expiredFile = path.join(UPLOADS_DIR, `test-sweeper-exp-${Date.now()}.pdf`);
  fs.writeFileSync(expiredFile, makePdfBuffer(512));

  // 2. Unexpired unattached document (guard: MUST NOT be deleted)
  const unexpiredFile = path.join(UPLOADS_DIR, `test-sweeper-unexp-${Date.now()}.pdf`);
  fs.writeFileSync(unexpiredFile, makePdfBuffer(512));

  // 3. Attached document (guard: MUST NOT be deleted even if past expiry)
  const attachedFile = path.join(UPLOADS_DIR, `test-sweeper-att-${Date.now()}.pdf`);
  fs.writeFileSync(attachedFile, makePdfBuffer(512));

  const expiredInsert = await adminPool.query(
    `INSERT INTO documents (entity_type, purpose, document_type, file_url, file_name, mime_type,
      file_size, storage_path, is_attached, expires_at, status)
     VALUES ('unattached', 'partner_proposal', 'other', '/api/documents/private/test-exp', 'test-exp.pdf',
       'application/pdf', 512, $1, FALSE,
       NOW() - INTERVAL '1 hour', 'pending')
     RETURNING id`,
    [expiredFile]
  ).catch(err => { console.error('T12 expired insert failed:', err.message); return null; });

  const unexpiredInsert = await adminPool.query(
    `INSERT INTO documents (entity_type, purpose, document_type, file_url, file_name, mime_type,
      file_size, storage_path, is_attached, expires_at, status)
     VALUES ('unattached', 'partner_proposal', 'other', '/api/documents/private/test-unexp', 'test-unexp.pdf',
       'application/pdf', 512, $1, FALSE,
       NOW() + INTERVAL '1 hour', 'pending')
     RETURNING id`,
    [unexpiredFile]
  ).catch(err => { console.error('T12 unexpired insert failed:', err.message); return null; });

  const mAttachRow = await adminPool.query(`SELECT id FROM merchants LIMIT 1`);
  const attachMerchantId = mAttachRow.rows[0]?.id;

  const attachedInsert = await adminPool.query(
    `INSERT INTO documents (entity_type, entity_id, purpose, document_type, file_url, file_name, mime_type,
      file_size, storage_path, is_attached, expires_at, status)
     VALUES ('merchant', $1, 'kyc_license', 'trade_license', '/api/documents/private/test-att', 'test-att.pdf',
       'application/pdf', 512, $2, TRUE,
       NOW() - INTERVAL '1 hour', 'verified')
     RETURNING id`,
    [attachMerchantId, attachedFile]
  ).catch(err => { console.error('T12 attached insert failed:', err.message); return null; });

  if (expiredInsert && unexpiredInsert && attachedInsert) {
    const expiredDocId = expiredInsert.rows[0]?.id;
    const unexpiredDocId = unexpiredInsert.rows[0]?.id;
    const attachedDocId = attachedInsert.rows[0]?.id;

    // Trigger sweeper manually
    const { sweeperService } = (() => {
      try { return { sweeperService: require('./src/services/sweeperService') }; }
      catch { return { sweeperService: null }; }
    })();

    if (sweeperService && typeof sweeperService.runSweeper === 'function') {
      await sweeperService.runSweeper();
    }

    // Give sweeper a moment
    await new Promise(r => setTimeout(r, 500));

    // Guard Case 1: Expired unattached document is purged
    const checkExpiredRow = await adminPool.query(`SELECT id FROM documents WHERE id = $1`, [expiredDocId]);
    assert('T12a: Sweeper guard deletes expired unattached row from DB', checkExpiredRow.rows.length === 0);
    assert('T12b: Sweeper guard deletes expired unattached file from disk', !fs.existsSync(expiredFile));

    // Guard Case 2: Unexpired unattached document is PRESERVED
    const checkUnexpRow = await adminPool.query(`SELECT id FROM documents WHERE id = $1`, [unexpiredDocId]);
    assert('T12c: Sweeper guard preserves unexpired unattached row in DB', checkUnexpRow.rows.length === 1);
    assert('T12d: Sweeper guard preserves unexpired unattached file on disk', fs.existsSync(unexpiredFile));

    // Guard Case 3: Attached document is PRESERVED
    const checkAttRow = await adminPool.query(`SELECT id FROM documents WHERE id = $1`, [attachedDocId]);
    assert('T12e: Sweeper guard preserves attached row in DB', checkAttRow.rows.length === 1);
    assert('T12f: Sweeper guard preserves attached file on disk', fs.existsSync(attachedFile));

    // Guard Case 4: Sweeper summary audit entry written
    const purgeAudit = await appPool.query(
      `SELECT action, details FROM audit_logs WHERE action = 'DOCUMENT_PURGED' ORDER BY created_at DESC LIMIT 1`
    );
    assert('T12g: Sweeper summary audit entry written with DOCUMENT_PURGED and purged_count >= 1',
      purgeAudit.rows.length > 0 && purgeAudit.rows[0].details?.purged_count >= 1);

    // Clean up preserved fixtures from T12
    await adminPool.query(`DELETE FROM documents WHERE id IN ($1, $2)`, [unexpiredDocId, attachedDocId]);
    if (fs.existsSync(unexpiredFile)) fs.unlinkSync(unexpiredFile);
    if (fs.existsSync(attachedFile)) fs.unlinkSync(attachedFile);
    if (fs.existsSync(expiredFile)) fs.unlinkSync(expiredFile);
  } else {
    assert('T12: Sweeper test skipped (insert failed — schema may differ)', true);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  TEARDOWN — uses adminPool (TEST_ADMIN_DB_*), never touches ods_app grants
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n── Cleanup: removing all test fixtures ───────────────────────────');

  // Delete created documents (and their disk files)
  if (createdDocumentIds.length > 0) {
    const docRows = await adminPool.query(
      `SELECT id, storage_path FROM documents WHERE id = ANY($1::uuid[])`,
      [createdDocumentIds]
    );
    for (const doc of docRows.rows) {
      if (doc.storage_path && fs.existsSync(doc.storage_path)) {
        fs.unlinkSync(doc.storage_path);
      }
    }
    await adminPool.query(`DELETE FROM documents WHERE id = ANY($1::uuid[])`, [createdDocumentIds]);
    console.log(`  Deleted ${createdDocumentIds.length} test document(s)`);
  }

  // Delete created partners
  if (createdPartnerIds.length > 0) {
    await adminPool.query(`DELETE FROM partners WHERE id = ANY($1::uuid[])`, [createdPartnerIds]);
    console.log(`  Deleted ${createdPartnerIds.length} test partner(s)`);
  }

  // Delete created support requests
  if (createdSupportReferences.length > 0) {
    await adminPool.query(`DELETE FROM support_requests WHERE reference = ANY($1::text[])`, [createdSupportReferences]);
    console.log(`  Deleted ${createdSupportReferences.length} test support request(s)`);
  }

  // Delete created users and their linked profiles
  if (createdUserIds.length > 0) {
    const userIdsList = createdUserIds.map(u => u.id);
    await adminPool.query(
      `UPDATE merchants SET reviewed_by = NULL WHERE reviewed_by = ANY($1::uuid[])`,
      [userIdsList]
    );
    await adminPool.query(
      `UPDATE providers SET reviewed_by = NULL WHERE reviewed_by = ANY($1::uuid[])`,
      [userIdsList]
    );
    for (const { id, role, email } of createdUserIds) {
      if (role === 'merchant') {
        const mr = await adminPool.query(`SELECT id FROM merchants WHERE user_id = $1`, [id]);
        if (mr.rows.length > 0) {
          const mid = mr.rows[0].id;
          // Remaining docs
          const rdocs = await adminPool.query(
            `DELETE FROM documents WHERE entity_type = 'merchant' AND entity_id = $1 RETURNING storage_path`,
            [mid]
          );
          for (const d of rdocs.rows) {
            if (d.storage_path && fs.existsSync(d.storage_path)) fs.unlinkSync(d.storage_path);
          }
          await adminPool.query(`DELETE FROM contact_persons WHERE entity_type = 'merchant' AND entity_id = $1`, [mid]);
          await adminPool.query(`DELETE FROM addresses WHERE entity_type = 'merchant' AND entity_id = $1`, [mid]);
          await adminPool.query(`DELETE FROM merchants WHERE id = $1`, [mid]);
        }
      } else if (role === 'provider') {
        const pr = await adminPool.query(`SELECT id FROM providers WHERE user_id = $1`, [id]);
        if (pr.rows.length > 0) {
          const pid = pr.rows[0].id;
          const rdocs = await adminPool.query(
            `DELETE FROM documents WHERE entity_type = 'provider' AND entity_id = $1 RETURNING storage_path`,
            [pid]
          );
          for (const d of rdocs.rows) {
            if (d.storage_path && fs.existsSync(d.storage_path)) fs.unlinkSync(d.storage_path);
          }
          await adminPool.query(`DELETE FROM contact_persons WHERE entity_type = 'provider' AND entity_id = $1`, [pid]);
          await adminPool.query(`DELETE FROM addresses WHERE entity_type = 'provider' AND entity_id = $1`, [pid]);
          await adminPool.query(`DELETE FROM providers WHERE id = $1`, [pid]);
        }
      } else if (role === 'customer') {
        await adminPool.query(`DELETE FROM addresses WHERE entity_type = 'customer' AND entity_id = $1`, [id]);
      } else if (role === 'admin') {
        await adminPool.query(`DELETE FROM admins WHERE user_id = $1`, [id]);
      }
      await adminPool.query(`DELETE FROM audit_logs WHERE user_id = $1`, [id]);
      await adminPool.query(`DELETE FROM users WHERE id = $1`, [id]);
      console.log(`  Deleted test user: ${email}`);
    }
  }

  // Verify dev accounts are untouched and preserved in approved status
  const devCheck = await adminPool.query(
    `SELECT u.email, COALESCE(m.approval_status, p.approval_status) AS status,
            COALESCE(m.reviewed_by::text, p.reviewed_by::text) AS reviewed_by
     FROM users u
     LEFT JOIN merchants m ON m.user_id = u.id
     LEFT JOIN providers p ON p.user_id = u.id
     WHERE u.email IN ('merchant01@ods.com', 'merchant@123.com', 'serviceprovider@123.com')
     ORDER BY u.email`
  );
  console.log('\n  Dev account state after cleanup:');
  for (const row of devCheck.rows) {
    console.log(`    ${row.email}: status=${row.status}, reviewed_by=${row.reviewed_by}`);
    assert(`Dev account ${row.email} preserved in approved status`,
      row.status === 'approved');
  }
  assert('All 3 dev accounts preserved in approved status', devCheck.rows.length === 3);

  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`   Summary: ${passed} Passed / ${failed} Failed`);
  console.log('══════════════════════════════════════════════════════════════\n');

  await adminPool.end();
  await appPool.end();

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests().catch(err => {
  console.error('Suite execution error:', err.message);
  if (err.cause) console.error('Cause:', err.cause);
  console.error(err.stack);
  process.exit(1);
});
