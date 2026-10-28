/**
 * ODS Global Network — Batch 12 Verification Suite
 * Production Hardening, Operational Reliability, and Go-Live Gate Verification
 *
 * Usage:
 *   node test-batch12-endpoints.js
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const http = require('http');
const crypto = require('crypto');
const pool = require('./src/db');
const { app, server } = require('./src/server');
const {
  generateSecret,
  generateTOTP,
  verifyTOTP,
  generateRecoveryCodes,
  verifyAdminAuth2FA,
  setup2FA,
  enable2FA,
} = require('./src/services/twoFactorService');
const { consumeRateLimit } = require('./src/services/rateLimiterService');
const { validateEnvironment } = require('./src/config/envValidator');

const TEST_PORT = 3020;
let testServer = null;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: reqHeaders,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🚀 STARTING BATCH 12 (PRODUCTION HARDENING) VERIFICATION SUITE');
  console.log(`Port: ${TEST_PORT} | Database: ods_global.net`);
  console.log('================================================================\n');

  let passed = 0;
  const runId = crypto.randomUUID().slice(0, 8);

  try {
    // ── Test 1: Migration 024 Schema & Role Grants ──────────────
    process.stdout.write('  [TEST] T1.1: Migration 024 tables exist (rate_limit_buckets, admin_2fa_secrets) ... ');
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('rate_limit_buckets', 'admin_2fa_secrets')
    `);
    assert(tableRes.rows.length === 2, `Expected 2 tables, found ${tableRes.rows.length}`);
    console.log('✅ PASS');
    passed++;

    process.stdout.write('  [TEST] T1.2: Least-privilege grants: ods_app has SELECT, INSERT, UPDATE, DELETE on new tables ... ');
    const grantRes = await pool.query(`
      SELECT table_name, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE grantee = 'ods_app' AND table_name IN ('rate_limit_buckets', 'admin_2fa_secrets')
    `);
    assert(grantRes.rows.length >= 8, `Expected at least 8 grants for ods_app, found ${grantRes.rows.length}`);
    console.log('✅ PASS');
    passed++;

    // ── Test 2: Runtime Connection Least-Privilege Audit ────────
    process.stdout.write('  [TEST] T2.1: Runtime application pool connects strictly as non-superuser (ods_app) ... ');
    const userAudit = await pool.query(`
      SELECT current_user, (SELECT usesuper FROM pg_user WHERE usename = current_user) AS is_superuser
    `);
    assert(userAudit.rows[0].current_user === 'ods_app', `Expected user 'ods_app', got '${userAudit.rows[0].current_user}'`);
    assert(userAudit.rows[0].is_superuser === false, 'Runtime DB user must not be a superuser!');
    console.log('✅ PASS');
    passed++;

    // ── Test 3: Persistent Database Rate Limiting ────────────────
    process.stdout.write('  [TEST] T3.1: Persistent rate limiter writes to rate_limit_buckets and blocks on overflow ... ');
    const testKey = `test:ip_${runId}:login`;
    // Consume 3 hits in 10-second window with max 2
    const hit1 = await consumeRateLimit(testKey, 2, 10000);
    assert(hit1.allowed === true && hit1.currentPoints === 1, 'Hit 1 should be allowed with points=1');
    const hit2 = await consumeRateLimit(testKey, 2, 10000);
    assert(hit2.allowed === true && hit2.currentPoints === 2, 'Hit 2 should be allowed with points=2');
    const hit3 = await consumeRateLimit(testKey, 2, 10000);
    assert(hit3.allowed === false && hit3.currentPoints === 3, 'Hit 3 should be blocked with allowed=false');

    // Verify row exists in PostgreSQL table
    const bucketRow = await pool.query('SELECT points, expire_at FROM rate_limit_buckets WHERE key = $1', [testKey]);
    assert(bucketRow.rows.length === 1 && parseInt(bucketRow.rows[0].points, 10) === 3, 'DB bucket must record points=3');
    console.log('✅ PASS');
    passed++;

    // ── Test 4: Operational Health Probes ─────────────────────────
    process.stdout.write('  [TEST] T4.1: GET /health/liveness returns 200 with uptime and status ok ... ');
    const livenessRes = await makeRequest('GET', '/health/liveness');
    assert(livenessRes.status === 200, `Expected 200, got ${livenessRes.status}`);
    assert(livenessRes.body.status === 'ok', 'Expected status: "ok"');
    assert(typeof livenessRes.body.uptimeSeconds === 'number', 'Expected uptimeSeconds');
    console.log('✅ PASS');
    passed++;

    process.stdout.write('  [TEST] T4.2: GET /health/readiness returns 200 with database connection & pool metrics ... ');
    const readinessRes = await makeRequest('GET', '/health/readiness');
    assert(readinessRes.status === 200, `Expected 200, got ${readinessRes.status}`);
    assert(readinessRes.body.status === 'ready', 'Expected status: "ready"');
    assert(readinessRes.body.database.status === 'connected', 'Expected DB status: "connected"');
    assert(typeof readinessRes.body.database.latencyMs === 'number', 'Expected latencyMs');
    console.log('✅ PASS');
    passed++;

    // ── Test 5: Request ID Tracing ───────────────────────────────
    process.stdout.write('  [TEST] T5.1: API requests return X-Request-Id header for distributed log tracing ... ');
    const traceRes = await makeRequest('GET', '/health/liveness');
    assert(traceRes.headers['x-request-id'], 'Expected X-Request-Id header in response');
    console.log('✅ PASS');
    passed++;

    // ── Test 6: Admin Two-Factor Authentication (RFC 6238 TOTP) ─
    process.stdout.write('  [TEST] T6.1: TOTP generation and verification validates current time step and rejects invalid ... ');
    const secret = generateSecret();
    const validCode = generateTOTP(secret);
    assert(verifyTOTP(validCode, secret) === true, 'Generated TOTP code must verify as true');
    assert(verifyTOTP('000000', secret) === false, 'Invalid TOTP code must be rejected');
    console.log('✅ PASS');
    passed++;

    process.stdout.write('  [TEST] T6.2: Single-use recovery codes validate and are atomically consumed ... ');
    // Create test user for 2FA
    const testAdminRes = await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role, is_active, is_email_verified)
      VALUES ($1, 'hash', 'Test 2FA Admin', 'admin', TRUE, TRUE)
      RETURNING id
    `, [`admin_2fa_${runId}@odsglobal.net`]);
    const testAdminId = testAdminRes.rows[0].id;

    const setupResult = await setup2FA(testAdminId, `admin_2fa_${runId}@odsglobal.net`);
    assert(setupResult.recoveryCodes.length === 8, 'Expected 8 recovery codes');

    // Confirm initial 2FA activation
    const firstCode = generateTOTP(setupResult.secret);
    const enabled = await enable2FA(testAdminId, firstCode);
    assert(enabled === true, 'Failed to enable 2FA with valid code');

    // Use recovery code 0
    const recCode = setupResult.recoveryCodes[0];
    const recRes = await verifyAdminAuth2FA(testAdminId, recCode);
    assert(recRes.success === true && recRes.method === 'recovery_code', 'Recovery code verification failed');
    assert(recRes.remainingRecoveryCodes === 7, `Expected 7 remaining codes, got ${recRes.remainingRecoveryCodes}`);

    // Replay same recovery code -> must fail
    const replayRes = await verifyAdminAuth2FA(testAdminId, recCode);
    assert(replayRes.success === false, 'Replaying consumed recovery code must be rejected!');
    console.log('✅ PASS');
    passed++;

    // ── Test 7: Startup Environment Validator Invariants ────────
    process.stdout.write('  [TEST] T7.1: Environment validator enforces production invariants and rejects dev defaults ... ');
    // In current test/development mode, validator returns true
    assert(validateEnvironment() === true, 'validateEnvironment should pass in development mode');

    // Test production mode with weak secret
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;
    let caughtProductionError = false;
    try {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'short';
      validateEnvironment();
    } catch (_) {
      caughtProductionError = true;
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.JWT_SECRET = originalSecret;
    }
    assert(caughtProductionError === true, 'Validator must halt when JWT_SECRET is weak in production!');
    console.log('✅ PASS');
    passed++;

    // ── Test 8: Anonymous Upload Atomic Quota Serialization ───────
    process.stdout.write('  [TEST] T8.1: documents.js acquires pg_advisory_xact_lock eliminating upload race condition ... ');
    const fs = require('fs');
    const docFileContent = fs.readFileSync('src/routes/documents.js', 'utf8');
    assert(docFileContent.includes("pg_advisory_xact_lock(hashtext('anon_upload_quota'))"), 'Advisory lock missing from documents.js');
    console.log('✅ PASS');
    passed++;

    // Cleanup test user and bucket (ods_app cannot DELETE from users, so we deactivate)
    await pool.query('DELETE FROM admin_2fa_secrets WHERE user_id = $1', [testAdminId]);
    await pool.query('UPDATE users SET is_active = FALSE WHERE id = $1', [testAdminId]);
    await pool.query('DELETE FROM rate_limit_buckets WHERE key = $1', [testKey]);

    console.log('\n================================================================');
    console.log(`🏁 TEST SUITE SUMMARY: ${passed} PASSED | 0 FAILED`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE:', err.message);
    process.exit(1);
  } finally {
    if (testServer) {
      testServer.close();
    }
    process.exit(0);
  }
}

// Start test harness
testServer = app.listen(TEST_PORT, () => {
  runTests();
});
