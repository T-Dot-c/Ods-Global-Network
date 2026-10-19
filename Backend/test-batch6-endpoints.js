/**
 * ODS Global Network — Batch 6 Payment & Webhook Security Verification Suite
 *
 * Covers:
 *   - Phase 1: Migration 016 & least-privilege ods_app permission checks (T1a-T1e)
 *   - Phase 2: Payment initialization with validation and auth gating (T2a-T2d)
 *   - Phase 3: Cryptographic HMAC signature webhook verification (T3a-T3d)
 *   - Phase 4: Webhook idempotency and replay attack prevention (T4a)
 *   - Phase 5: Verification lookup, cross-tenant IDOR protection, and itemized receipt retrieval (T5a-T5d)
 *   - Phase 6: Zero secret leak audit (T6a)
 *
 * Usage:
 *   node -e "process.env.ALLOW_DESTRUCTIVE_TESTS = '1'; require('./test-batch6-endpoints.js');"
 */
'use strict';

const crypto = require('crypto');
const path = require('path');
const { spawn } = require('child_process');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

if (process.env.ALLOW_DESTRUCTIVE_TESTS !== '1') {
  console.error('\n❌ [ABORT] Safety guard active: ALLOW_DESTRUCTIVE_TESTS=1 must be set to run Batch 6 tests.\n');
  process.exit(1);
}

const runId = crypto.randomBytes(4).toString('hex');
const TEST_PORT = 3007;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const CHAPA_TEST_SECRET = 'ods-test-webhook-secret';

// ── Database Pools ────────────────────────────────────────────────────────────
const adminPool = new Pool({
  host: process.env.TEST_ADMIN_DB_HOST || process.env.DB_HOST,
  port: process.env.TEST_ADMIN_DB_PORT || process.env.DB_PORT,
  database: process.env.TEST_ADMIN_DB_NAME || process.env.DB_NAME,
  user: process.env.TEST_ADMIN_DB_USER || 'postgres',
  password: process.env.TEST_ADMIN_DB_PASSWORD || process.env.DB_PASSWORD,
  ssl: false,
});

const appPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER || 'ods_app',
  password: process.env.DB_PASSWORD,
  ssl: false,
});

// Test fixtures to track for cleanup
const trackedUserIds = [];
const trackedTransactions = [];
let capturedLogs = '';

function pass(name) {
  console.log(`  ✅ [PASS] ${name}`);
}

function fail(name, detail) {
  console.error(`  ❌ [FAIL] ${name}: ${detail}`);
  throw new Error(`Test assertion failed: ${name}`);
}

/**
 * Spawn isolated child server for testing
 */
function spawnTestServer() {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PORT: String(TEST_PORT),
      NODE_ENV: 'development',
      CHAPA_SECRET_KEY: 'CHASECK_TEST-mock-key',
      CHAPA_WEBHOOK_SECRET: CHAPA_TEST_SECRET,
      CHAPA_SIMULATOR_MODE: 'true',
    };

    const child = spawn(process.execPath, [path.join(__dirname, 'src', 'server.js')], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (d) => {
      const str = d.toString();
      capturedLogs += str;
      if (str.includes(`[ODS API] Running on http://localhost:${TEST_PORT}`)) {
        resolve(child);
      }
    });

    child.stderr.on('data', (d) => {
      capturedLogs += d.toString();
    });

    child.on('error', reject);

    setTimeout(() => {
      reject(new Error(`Test server on port ${TEST_PORT} failed to start in 8s. Logs:\n${capturedLogs}`));
    }, 8000);
  });
}

/**
 * Helper: Create user directly via adminPool
 */
async function createTestUser({ email, role = 'customer', isVerified = true, isActive = true }) {
  const hash = await bcrypt.hash('TestPass123!', 10);
  const res = await adminPool.query(
    `INSERT INTO users (email, password_hash, role, full_name, phone, is_active, is_email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, role`,
    [email, hash, role, 'Test User', `+25191${Date.now().toString().slice(-7)}`, isActive, isVerified]
  );
  const user = res.rows[0];
  trackedUserIds.push(user.id);
  return user;
}

/**
 * Helper: Login via child server to obtain session cookie
 */
async function loginUser(email, password = 'TestPass123!') {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const cookie = res.headers.get('set-cookie');
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, cookie };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TEST RUNNER
// ─────────────────────────────────────────────────────────────────────────────
async function runTests() {
  console.log('===============================================================');
  console.log(`  ODS Global Network — Batch 6 Payment Test Suite (Run: ${runId})`);
  console.log('===============================================================\n');

  let childServer;
  try {
    console.log(`[Harness] Spawning test child server on port ${TEST_PORT}...`);
    childServer = await spawnTestServer();
    console.log(`[Harness] Child server ready on port ${TEST_PORT}.\n`);

    // ── Phase 1: Migration 016 & Database Permissions ──────────────────────────
    console.log('── Phase 1: Migration 016 & Database Permissions ─────────────');

    // T1a: Check columns
    const colsRes = await appPool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_schema = current_schema() AND table_name = 'transactions'`
    );
    const colNames = colsRes.rows.map((r) => r.column_name);
    if (!colNames.includes('tx_ref') || !colNames.includes('amount') || !colNames.includes('status')) {
      fail('T1a', 'transactions table missing required columns');
    }
    pass('T1a: transactions table exists with expected schema and columns');

    // T1b: SELECT permission
    const selectRes = await appPool.query('SELECT COUNT(*) FROM transactions');
    pass('T1b: ods_app successfully executed SELECT on transactions');

    // T1c: INSERT permission
    const testUser = await createTestUser({ email: `b6_user_${runId}@ods-test.local` });
    const insertRes = await appPool.query(
      `INSERT INTO transactions (user_id, tx_ref, amount, currency, status, payment_method, purpose)
       VALUES ($1, $2, 100.00, 'ETB', 'pending', 'chapa', 'test_init')
       RETURNING id, tx_ref`,
      [testUser.id, `tx-test-${runId}`]
    );
    if (insertRes.rows.length !== 1) fail('T1c', 'Insert failed');
    trackedTransactions.push(`tx-test-${runId}`);
    pass('T1c: ods_app successfully executed INSERT on transactions');

    // T1d: UPDATE permission
    const updateRes = await appPool.query(
      `UPDATE transactions SET status = 'completed' WHERE tx_ref = $1 RETURNING status`,
      [`tx-test-${runId}`]
    );
    if (updateRes.rows[0]?.status !== 'completed') fail('T1d', 'Update failed');
    pass('T1d: ods_app successfully executed UPDATE on transactions');

    // T1e: DELETE denied (least privilege)
    let deleteFailed = false;
    try {
      await appPool.query(`DELETE FROM transactions WHERE tx_ref = $1`, [`tx-test-${runId}`]);
    } catch (err) {
      if (err.code === '42501') deleteFailed = true;
    }
    if (!deleteFailed) fail('T1e', 'ods_app should be denied DELETE privilege on transactions');
    pass('T1e: ods_app is strictly denied DELETE on transactions (42501)');

    // ── Phase 2: Payment Initialization ────────────────────────────────────────
    console.log('\n── Phase 2: Payment Initialization ───────────────────────────');

    // T2a: Anonymous denied (401)
    const anonRes = await fetch(`${BASE_URL}/api/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 150 }),
    });
    if (anonRes.status !== 401) fail('T2a', `Expected 401, got ${anonRes.status}`);
    pass('T2a: Anonymous request denied on POST /api/payments/initialize (401)');

    // T2b: Unverified user denied (403 EMAIL_VERIFICATION_REQUIRED)
    const unverifiedUser = await createTestUser({
      email: `b6_unverified_${runId}@ods-test.local`,
      isVerified: false,
    });
    const unverifiedLogin = await loginUser(unverifiedUser.email);
    const unverifiedPay = await fetch(`${BASE_URL}/api/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: unverifiedLogin.cookie,
      },
      body: JSON.stringify({ amount: 200 }),
    });
    if (unverifiedPay.status !== 403) fail('T2b', `Expected 403, got ${unverifiedPay.status}`);
    pass('T2b: Unverified user denied on payment initialize (403)');

    // T2c: Verified customer succeeds (200)
    const verifiedUser = await createTestUser({
      email: `b6_verified_${runId}@ods-test.local`,
      isVerified: true,
    });
    const verifiedLogin = await loginUser(verifiedUser.email);
    const initRes = await fetch(`${BASE_URL}/api/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: verifiedLogin.cookie,
      },
      body: JSON.stringify({
        amount: 250,
        currency: 'ETB',
        purpose: 'Clinical Consultation',
      }),
    });
    const initData = await initRes.json();
    if (initRes.status !== 200 || !initData.success || !initData.checkout_url) {
      fail('T2c', `Expected 200 with checkout_url, got ${initRes.status}`);
    }
    trackedTransactions.push(initData.tx_ref);
    pass('T2c: Verified customer initiates payment (200) returning checkout_url and tx_ref');

    // T2d: Invalid amounts rejected (400)
    const badAmounts = [-10, 0, 'invalid_number', 999999999];
    for (const badAmt of badAmounts) {
      const badRes = await fetch(`${BASE_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: verifiedLogin.cookie,
        },
        body: JSON.stringify({ amount: badAmt }),
      });
      if (badRes.status !== 400) fail('T2d', `Expected 400 for amount ${badAmt}, got ${badRes.status}`);
    }
    pass('T2d: Invalid amounts (negative, zero, string, or oversize) rejected (400)');

    // ── Phase 3: Cryptographic HMAC Webhook Security ───────────────────────────
    console.log('\n── Phase 3: Cryptographic HMAC Webhook Security ──────────────');

    const txRefForWebhook = initData.tx_ref;
    const webhookPayload = JSON.stringify({
      tx_ref: txRefForWebhook,
      status: 'success',
      reference: `chapa_ref_${runId}`,
    });

    // T3a: Missing signature rejected (401)
    const noSigRes = await fetch(`${BASE_URL}/api/payments/webhook/chapa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: webhookPayload,
    });
    if (noSigRes.status !== 401) fail('T3a', `Expected 401, got ${noSigRes.status}`);
    pass('T3a: Webhook with missing signature rejected (401)');

    // T3b: Tampered/invalid signature rejected (401)
    const fakeSig = crypto.createHmac('sha256', 'wrong-secret').update(webhookPayload).digest('hex');
    const badSigRes = await fetch(`${BASE_URL}/api/payments/webhook/chapa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'chapa-signature': fakeSig,
      },
      body: webhookPayload,
    });
    if (badSigRes.status !== 401) fail('T3b', `Expected 401, got ${badSigRes.status}`);
    pass('T3b: Webhook with invalid HMAC signature rejected (401)');

    // T3c: Valid signature accepted (200) and updates status to completed
    const validSig = crypto.createHmac('sha256', CHAPA_TEST_SECRET).update(webhookPayload).digest('hex');
    const goodWebhookRes = await fetch(`${BASE_URL}/api/payments/webhook/chapa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'chapa-signature': validSig,
      },
      body: webhookPayload,
    });
    if (goodWebhookRes.status !== 200) fail('T3c', `Expected 200, got ${goodWebhookRes.status}`);

    // Verify in database that status transitioned to completed
    const dbTxRes = await appPool.query(
      `SELECT status, chapa_reference, completed_at FROM transactions WHERE tx_ref = $1`,
      [txRefForWebhook]
    );
    const completedTx = dbTxRes.rows[0];
    if (completedTx.status !== 'completed' || !completedTx.completed_at) {
      fail('T3c', 'Transaction status was not marked completed in DB');
    }
    pass('T3c: Valid HMAC webhook accepted (200) and marks status = completed with timestamp');

    // T3d: Webhook with failed status marks status = failed
    const failedTxRef = `ods-failed-${runId}`;
    await adminPool.query(
      `INSERT INTO transactions (user_id, tx_ref, amount, currency, status, purpose)
       VALUES ($1, $2, 50, 'ETB', 'pending', 'test_fail')`,
      [verifiedUser.id, failedTxRef]
    );
    trackedTransactions.push(failedTxRef);

    const failedPayload = JSON.stringify({ tx_ref: failedTxRef, status: 'failed' });
    const failedSig = crypto.createHmac('sha256', CHAPA_TEST_SECRET).update(failedPayload).digest('hex');
    await fetch(`${BASE_URL}/api/payments/webhook/chapa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'chapa-signature': failedSig,
      },
      body: failedPayload,
    });

    const failedCheck = await appPool.query(
      `SELECT status FROM transactions WHERE tx_ref = $1`,
      [failedTxRef]
    );
    if (failedCheck.rows[0]?.status !== 'failed') fail('T3d', 'Status was not marked failed');
    pass('T3d: Webhook with status = failed marks transaction failed (200)');

    // ── Phase 4: Idempotency & Replay Defense ──────────────────────────────────
    console.log('\n── Phase 4: Idempotency & Replay Defense ─────────────────────');

    // T4a: Replay identical webhook — must return 200 with zero duplicate mutations
    const preCountRes = await appPool.query(
      `SELECT updated_at FROM transactions WHERE tx_ref = $1`,
      [txRefForWebhook]
    );
    const preUpdatedAt = preCountRes.rows[0].updated_at;

    const replayRes = await fetch(`${BASE_URL}/api/payments/webhook/chapa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'chapa-signature': validSig,
      },
      body: webhookPayload,
    });
    if (replayRes.status !== 200) fail('T4a', `Expected 200, got ${replayRes.status}`);

    const postCountRes = await appPool.query(
      `SELECT updated_at FROM transactions WHERE tx_ref = $1`,
      [txRefForWebhook]
    );
    const postUpdatedAt = postCountRes.rows[0].updated_at;

    if (new Date(preUpdatedAt).getTime() !== new Date(postUpdatedAt).getTime()) {
      fail('T4a', 'Replayed webhook caused duplicate database mutation');
    }
    pass('T4a: Webhook replay returns 200 with zero duplicate database mutations (idempotent)');

    // ── Phase 5: Verification Lookup, IDOR & Receipts ──────────────────────────
    console.log('\n── Phase 5: Verification Lookup, IDOR & Receipts ─────────────');

    // T5a: Owner can verify transaction
    const verifyRes = await fetch(`${BASE_URL}/api/payments/verify/${txRefForWebhook}`, {
      method: 'GET',
      headers: { cookie: verifiedLogin.cookie },
    });
    const verifyData = await verifyRes.json();
    if (verifyRes.status !== 200 || verifyData.transaction?.status !== 'completed') {
      fail('T5a', 'Owner could not verify completed transaction');
    }
    pass('T5a: Authenticated owner successfully verifies transaction (200)');

    // T5b: Cross-tenant IDOR protection (Customer B cannot verify Customer A tx)
    const otherUser = await createTestUser({ email: `b6_other_${runId}@ods-test.local` });
    const otherLogin = await loginUser(otherUser.email);
    const idorRes = await fetch(`${BASE_URL}/api/payments/verify/${txRefForWebhook}`, {
      method: 'GET',
      headers: { cookie: otherLogin.cookie },
    });
    if (idorRes.status !== 403) fail('T5b', `Expected 403, got ${idorRes.status}`);
    pass('T5b: Cross-tenant IDOR blocked: other customer denied on GET /verify/:txRef (403)');

    // T5c: Itemized receipt retrieval
    const receiptRes = await fetch(`${BASE_URL}/api/payments/receipt/${txRefForWebhook}`, {
      method: 'GET',
      headers: { cookie: verifiedLogin.cookie },
    });
    const receiptData = await receiptRes.json();
    if (receiptRes.status !== 200 || !receiptData.receipt || receiptData.receipt.amount !== 250) {
      fail('T5c', 'Receipt payload missing or invalid');
    }
    pass('T5c: GET /api/payments/receipt/:txRef returns full itemized receipt payload');

    // T5d: Customer transaction history
    const historyRes = await fetch(`${BASE_URL}/api/payments/history`, {
      method: 'GET',
      headers: { cookie: verifiedLogin.cookie },
    });
    const historyData = await historyRes.json();
    if (historyRes.status !== 200 || !Array.isArray(historyData.transactions) || historyData.transactions.length === 0) {
      fail('T5d', 'Transaction history empty or missing');
    }
    pass('T5d: GET /api/payments/history returns customer transaction records');

    // ── Phase 6: Zero Secret Leak Audit ────────────────────────────────────────
    console.log('\n── Phase 6: Zero Secret Leak Audit ───────────────────────────');
    if (capturedLogs.includes('CHASECK_TEST-mock-key') || capturedLogs.includes(CHAPA_TEST_SECRET)) {
      fail('T6a', 'Captured log streams leaked secret API keys or webhook secrets');
    }
    pass('T6a: Zero secret leakage: no Chapa API keys or webhook secrets found in logs');

    console.log('\n===============================================================');
    console.log('  Batch 6 Payment Test Suite Complete: All Tests Passed! ✅');
    console.log('===============================================================\n');
  } finally {
    // Teardown child server
    if (childServer) {
      childServer.kill();
    }

    // Teardown test fixtures
    console.log('[Teardown] Cleaning up test fixtures...');
    try {
      if (trackedTransactions.length > 0) {
        await adminPool.query(
          `DELETE FROM transactions WHERE tx_ref = ANY($1)`,
          [trackedTransactions]
        );
      }
      if (trackedUserIds.length > 0) {
        await adminPool.query(
          `DELETE FROM users WHERE id = ANY($1)`,
          [trackedUserIds]
        );
      }
      console.log(`[Teardown] Removed ${trackedTransactions.length} test transactions and ${trackedUserIds.length} test users.`);
    } catch (err) {
      console.error('[Teardown] Error during cleanup:', err.message);
    }

    await adminPool.end();
    await appPool.end();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Unhandled test failure:', err.message);
  process.exit(1);
});
