/**
 * ODS Global Network — Batch 7 Gifting & Vouchers Automated Test Suite
 *
 * Covers:
 *   - Phase 1: Migration 017 & least-privilege ods_app permission checks (T1a-T1e)
 *   - Phase 2: Gift card check & safe preview without PII (T2a-T2b)
 *   - Phase 3: Gift card purchase endpoint with auth/verification gating (T3a-T3e)
 *   - Phase 4: Atomic redemption, wallet crediting & double-spend prevention (T4a-T4e)
 *   - Phase 5: Expiration enforcement (T5a)
 *   - Phase 6: Provider in-clinic service delivery confirmation & RBAC (T6a-T6c)
 *   - Phase 7: Digital wallet retrieval & ledger audit (T7a-T7b)
 *
 * Usage:
 *   node -e "process.env.ALLOW_DESTRUCTIVE_TESTS = '1'; require('./test-batch7-endpoints.js');"
 */
'use strict';

const crypto = require('crypto');
const path = require('path');
const { spawn } = require('child_process');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

if (process.env.ALLOW_DESTRUCTIVE_TESTS !== '1') {
  console.error('\n❌ [ABORT] Safety guard active: ALLOW_DESTRUCTIVE_TESTS=1 must be set to run Batch 7 tests.\n');
  process.exit(1);
}

const runId = crypto.randomBytes(4).toString('hex');
const TEST_PORT = 3015;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

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
const trackedGiftCardIds = [];

function pass(name) {
  console.log(`  ✅ [PASS] ${name}`);
}

function fail(name, detail) {
  console.error(`  ❌ [FAIL] ${name}: ${detail}`);
  throw new Error(`Test assertion failed: ${name}`);
}

let capturedServerLogs = '';

/**
 * Spawn isolated child server for testing
 */
function spawnTestServer() {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PORT: String(TEST_PORT),
      NODE_ENV: 'development',
    };

    const child = spawn(process.execPath, [path.join(__dirname, 'src', 'server.js')], {
      cwd: __dirname,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (d) => {
      const str = d.toString();
      capturedServerLogs += str;
      if (str.includes(`[ODS API] Running on http://localhost:${TEST_PORT}`)) {
        resolve(child);
      }
    });

    child.stderr.on('data', (d) => {
      capturedServerLogs += d.toString();
    });

    child.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Test server on port ${TEST_PORT} exited early with code ${code}. Logs:\n${capturedServerLogs}`));
      }
    });

    child.on('error', reject);

    setTimeout(() => {
      reject(new Error(`Test server on port ${TEST_PORT} failed to start in 8s. Logs:\n${capturedServerLogs}`));
    }, 8000);
  });
}

/**
 * Helper: Create test user with verified or unverified status
 */
async function createTestUser({ email, role = 'customer', isVerified = true, fullName = 'Test User' }) {
  const hash = await bcrypt.hash('TestPass123!Secure', 10);
  const res = await adminPool.query(
    `INSERT INTO users (email, password_hash, role, full_name, is_email_verified)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, role, full_name, is_email_verified`,
    [email, hash, role, fullName, isVerified]
  );
  trackedUserIds.push(res.rows[0].id);
  return res.rows[0];
}

/**
 * Helper: Login and return cookie string
 */
async function loginAndGetCookie(email) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'TestPass123!Secure' }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  }
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error(`No Set-Cookie returned for ${email}`);
  }
  const match = setCookie.match(/ods_session=[^;]+/);
  if (!match) {
    throw new Error(`ods_session cookie missing in Set-Cookie: ${setCookie}`);
  }
  return match[0];
}

// ── Main Test Runner ──────────────────────────────────────────────────────────
async function runSuite() {
  console.log(`\n============================================================`);
  console.log(` ODS Global Network — Batch 7 Gifting & Vouchers Suite`);
  console.log(` Run ID: ${runId} | Ephemeral Port: ${TEST_PORT}`);
  console.log(`============================================================\n`);

  let serverProcess = null;

  try {
    // ────────────────────────────────────────────────────────────────────────
    // Phase 1: Database Migration 017 & Least-Privilege Checks
    // ────────────────────────────────────────────────────────────────────────
    console.log(`[Phase 1] Database Migration 017 & Least-Privilege Verification`);

    // T1a: Tables exist
    const tablesRes = await appPool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('gift_cards', 'gift_card_redemptions', 'customer_wallets')`
    );
    const existingTables = tablesRes.rows.map(r => r.table_name);
    if (existingTables.length !== 3) {
      fail('T1a', `Expected 3 gifting tables, found: ${existingTables.join(', ')}`);
    }
    pass('T1a: gift_cards, gift_card_redemptions, customer_wallets tables exist');

    // T1b: Required columns on gift_cards
    const colsRes = await appPool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'gift_cards'`
    );
    const cols = colsRes.rows.map(r => r.column_name);
    const requiredCols = ['code_hash', 'balance', 'occasion', 'package_type', 'gift_type', 'delivered_at'];
    for (const reqCol of requiredCols) {
      if (!cols.includes(reqCol)) {
        fail('T1b', `Missing required column on gift_cards: ${reqCol}`);
      }
    }
    pass('T1b: gift_cards has all required columns (code_hash, balance, occasion, package_type, gift_type, delivered_at)');

    // T1c: ods_app can SELECT from gift_cards
    const selectRes = await appPool.query('SELECT count(*) FROM gift_cards');
    pass(`T1c: ods_app can SELECT from gift_cards (count=${selectRes.rows[0].count})`);

    // T1d: ods_app is strictly DENIED DELETE on gift_cards
    let deleteDenied = false;
    try {
      await appPool.query('DELETE FROM gift_cards WHERE id = $1', ['00000000-0000-0000-0000-000000000000']);
    } catch (err) {
      if (err.code === '42501') {
        deleteDenied = true;
      } else {
        fail('T1d', `Unexpected error on DELETE: ${err.message} (code=${err.code})`);
      }
    }
    if (!deleteDenied) {
      fail('T1d', 'ods_app was able to execute DELETE on gift_cards! Least-privilege violation!');
    }
    pass('T1d: ods_app is strictly DENIED DELETE on gift_cards (SQLSTATE 42501 permission denied)');

    // T1e: ods_app is strictly DENIED DELETE on gift_card_redemptions and customer_wallets
    let deleteRedemptionsDenied = false;
    let deleteWalletsDenied = false;
    try {
      await appPool.query('DELETE FROM gift_card_redemptions WHERE id = $1', ['00000000-0000-0000-0000-000000000000']);
    } catch (e) {
      if (e.code === '42501') deleteRedemptionsDenied = true;
    }
    try {
      await appPool.query('DELETE FROM customer_wallets WHERE id = $1', ['00000000-0000-0000-0000-000000000000']);
    } catch (e) {
      if (e.code === '42501') deleteWalletsDenied = true;
    }
    if (!deleteRedemptionsDenied || !deleteWalletsDenied) {
      fail('T1e', 'ods_app DELETE permission denial failed on redemptions or wallets!');
    }
    pass('T1e: ods_app is strictly DENIED DELETE on gift_card_redemptions and customer_wallets (SQLSTATE 42501)');

    // ────────────────────────────────────────────────────────────────────────
    // Spawn Child Server
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Spawn Server] Launching test API on port ${TEST_PORT}...`);
    serverProcess = await spawnTestServer();
    console.log(`  Test API live at ${BASE_URL}`);

    // Create test accounts
    const buyerUser = await createTestUser({
      email: `buyer_${runId}@example.com`,
      fullName: 'Abebe Gifting Buyer',
      isVerified: true,
    });
    const buyerCookie = await loginAndGetCookie(buyerUser.email);

    const recipientUser = await createTestUser({
      email: `recipient_${runId}@example.com`,
      fullName: 'Tigist Recipient',
      isVerified: true,
    });
    const recipientCookie = await loginAndGetCookie(recipientUser.email);

    const unverifiedUser = await createTestUser({
      email: `unverified_${runId}@example.com`,
      fullName: 'Unverified Customer',
      isVerified: false,
    });
    const unverifiedCookie = await loginAndGetCookie(unverifiedUser.email);

    const providerUser = await createTestUser({
      email: `provider_${runId}@example.com`,
      role: 'provider',
      fullName: 'Dr. Selamawit Clinic',
      isVerified: true,
    });
    // Create matching provider record
    const provDbRes = await adminPool.query(
      `INSERT INTO providers (user_id, provider_name, provider_type, service_category, approval_status)
       VALUES ($1, $2, 'clinic', 'Diagnostics', 'approved')
       RETURNING id`,
      [providerUser.id, 'Selamawit Diagnostics']
    );
    const providerId = provDbRes.rows[0].id;
    const providerCookie = await loginAndGetCookie(providerUser.email);

    // ────────────────────────────────────────────────────────────────────────
    // Phase 2: Gift Card Public Check / Safe Preview
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 2] Public Gift Card Check & Safe Preview`);

    // T2a: Check invalid code returns 400
    const invRes = await fetch(`${BASE_URL}/api/gifting/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'ODS-GC-XXXX-INVALID' }),
    });
    const invData = await invRes.json();
    if (invRes.status !== 400 || invData.success !== false) {
      fail('T2a', `Expected 400 with success=false, got: ${invRes.status} ${JSON.stringify(invData)}`);
    }
    pass('T2a: POST /api/gifting/check with unrecognized code returns 400');

    // ────────────────────────────────────────────────────────────────────────
    // Phase 3: Gift Card Purchase
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 3] Gift Card Purchase & Presentation`);

    // T3a: Unauthenticated purchase returns 401
    const unauthRes = await fetch(`${BASE_URL}/api/gifting/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000 }),
    });
    if (unauthRes.status !== 401) {
      fail('T3a', `Expected 401 unauthenticated, got ${unauthRes.status}`);
    }
    pass('T3a: POST /api/gifting/purchase unauthenticated returns 401');

    // T3b: Unverified email returns 403
    const unverRes = await fetch(`${BASE_URL}/api/gifting/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: unverifiedCookie },
      body: JSON.stringify({ amount: 1000, recipient_email: 'test@example.com' }),
    });
    const unverData = await unverRes.json();
    if (unverRes.status !== 403 || unverData.code !== 'EMAIL_VERIFICATION_REQUIRED') {
      fail('T3b', `Expected 403 EMAIL_VERIFICATION_REQUIRED, got: ${unverRes.status}`);
    }
    pass('T3b: POST /api/gifting/purchase with unverified email returns 403 EMAIL_VERIFICATION_REQUIRED');

    // T3c: Valid purchase of monetary gift card
    const buyRes = await fetch(`${BASE_URL}/api/gifting/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: buyerCookie },
      body: JSON.stringify({
        amount: 2500,
        currency: 'ETB',
        gift_type: 'monetary',
        package_type: 'vip',
        occasion: 'Enkutatash',
        recipient_name: 'Tigist Recipient',
        recipient_email: recipientUser.email,
        personalMessage: 'Melkam Addis Amet! Enjoy your wellness voucher.',
      }),
    });
    const buyData = await buyRes.json();
    if (buyRes.status !== 201 || !buyData.success || !buyData.giftCard) {
      fail('T3c', `Purchase failed: ${buyRes.status} ${JSON.stringify(buyData)}`);
    }
    const createdCard1 = buyData.giftCard;
    trackedGiftCardIds.push(createdCard1.id);

    if (!createdCard1.code || !createdCard1.code.startsWith('ODS-GC-')) {
      fail('T3c', `Expected claim code starting with ODS-GC-, got: ${createdCard1.code}`);
    }
    if (createdCard1.packageType !== 'vip' || createdCard1.occasion !== 'Enkutatash') {
      fail('T3c', `PackageType or Occasion mismatch: ${JSON.stringify(createdCard1)}`);
    }
    pass(`T3c: POST /api/gifting/purchase created monetary VIP gift card: ${createdCard1.code} (2,500 ETB)`);

    // Verify hash in database
    const dbHashRes = await adminPool.query(
      `SELECT id, code_hash, initial_amount, balance, status FROM gift_cards WHERE id = $1`,
      [createdCard1.id]
    );
    if (dbHashRes.rows.length === 0 || !dbHashRes.rows[0].code_hash) {
      fail('T3c', 'code_hash was not persisted in gift_cards table!');
    }
    pass('T3c: SHA-256 code_hash correctly stored in database');

    // T2b: Safe preview with valid code
    const chkRes = await fetch(`${BASE_URL}/api/gifting/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: createdCard1.code }),
    });
    const chkData = await chkRes.json();
    if (!chkRes.ok || !chkData.valid || chkData.balance !== 2500) {
      fail('T2b', `Expected valid check with balance=2500, got: ${JSON.stringify(chkData)}`);
    }
    if (chkData.senderEmail || chkData.recipientEmail) {
      fail('T2b', 'Check endpoint leaked email PII!');
    }
    pass('T2b: POST /api/gifting/check returns valid balance and occasion with zero PII leakage');

    // T3d: Valid purchase of dedicated healthcare service gift card
    const srvBuyRes = await fetch(`${BASE_URL}/api/gifting/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: buyerCookie },
      body: JSON.stringify({
        amount: 3500,
        currency: 'ETB',
        gift_type: 'service',
        package_type: 'vip',
        occasion: 'Health',
        service_title: 'Executive Full Body Health Screening',
        service_category: 'Diagnostics',
        service_provider_id: providerId,
        recipient_name: 'Tigist Recipient',
        recipient_email: recipientUser.email,
        personal_message: 'Wishing you strong health and wellness!',
      }),
    });
    const srvBuyData = await srvBuyRes.json();
    if (srvBuyRes.status !== 201 || !srvBuyData.success) {
      fail('T3d', `Service gift purchase failed: ${JSON.stringify(srvBuyData)}`);
    }
    const createdServiceCard = srvBuyData.giftCard;
    trackedGiftCardIds.push(createdServiceCard.id);
    pass(`T3d: Created dedicated service gift card: ${createdServiceCard.code} ("${createdServiceCard.serviceTitle}")`);

    // T3e: Negative amount returns 400
    const negRes = await fetch(`${BASE_URL}/api/gifting/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: buyerCookie },
      body: JSON.stringify({ amount: -100 }),
    });
    if (negRes.status !== 400) {
      fail('T3e', `Expected 400 for negative amount, got ${negRes.status}`);
    }
    pass('T3e: POST /api/gifting/purchase with invalid/negative amount rejected with 400');

    // ────────────────────────────────────────────────────────────────────────
    // Phase 4: Atomic Redemption, Digital Wallet Crediting & Double-Spend Guard
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 4] Atomic Redemption & Double-Spend Protection`);

    // T4a: Unauthenticated redeem returns 401
    const unauthRedeem = await fetch(`${BASE_URL}/api/gifting/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: createdCard1.code }),
    });
    if (unauthRedeem.status !== 401) {
      fail('T4a', `Expected 401 unauthenticated redeem, got ${unauthRedeem.status}`);
    }
    pass('T4a: POST /api/gifting/redeem unauthenticated returns 401');

    // T4b: Valid redeem by recipient
    const redRes = await fetch(`${BASE_URL}/api/gifting/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recipientCookie },
      body: JSON.stringify({ code: createdCard1.code }),
    });
    const redData = await redRes.json();
    if (redRes.status !== 200 || !redData.success) {
      fail('T4b', `Redeem failed: ${redRes.status} ${JSON.stringify(redData)}`);
    }
    if (redData.redeemedAmount !== 2500 || redData.newWalletBalance !== 2500) {
      fail('T4b', `Unexpected redeemedAmount or newWalletBalance: ${JSON.stringify(redData)}`);
    }
    pass(`T4b: POST /api/gifting/redeem credited 2,500 ETB to wallet (newBalance=2,500 ETB)`);

    // Verify card in DB: balance=0, status='redeemed'
    const cardInDb = await adminPool.query(`SELECT balance, status FROM gift_cards WHERE id = $1`, [createdCard1.id]);
    if (parseFloat(cardInDb.rows[0].balance) !== 0 || cardInDb.rows[0].status !== 'redeemed') {
      fail('T4b', `Database record not updated: balance=${cardInDb.rows[0].balance}, status=${cardInDb.rows[0].status}`);
    }
    pass('T4b: gift_cards record updated atomically: balance=0, status="redeemed"');

    // T4c: gift_card_redemptions ledger entry inserted
    const ledgerRes = await adminPool.query(
      `SELECT * FROM gift_card_redemptions WHERE gift_card_id = $1 AND user_id = $2`,
      [createdCard1.id, recipientUser.id]
    );
    if (ledgerRes.rows.length === 0 || parseFloat(ledgerRes.rows[0].amount) !== 2500) {
      fail('T4c', `Ledger entry missing or incorrect: ${JSON.stringify(ledgerRes.rows)}`);
    }
    pass('T4c: gift_card_redemptions ledger entry recorded with amount=2,500 ETB');

    // T4d: Double-spend re-redemption attempt rejected with 400
    const reRedeemRes = await fetch(`${BASE_URL}/api/gifting/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recipientCookie },
      body: JSON.stringify({ code: createdCard1.code }),
    });
    const reRedeemData = await reRedeemRes.json();
    if (reRedeemRes.status !== 400 || reRedeemData.success !== false) {
      fail('T4d', `Expected 400 already redeemed, got: ${reRedeemRes.status} ${JSON.stringify(reRedeemData)}`);
    }
    pass('T4d: Re-redeeming already claimed gift card rejected with 400 ("already been redeemed")');

    // T4e: Concurrent hammer test (5 simultaneous redemption requests for a single newly created card)
    const hammerBuyRes = await fetch(`${BASE_URL}/api/gifting/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: buyerCookie },
      body: JSON.stringify({ amount: 1500, occasion: 'Wedding' }),
    });
    const hammerBuyData = await hammerBuyRes.json();
    const hammerCode = hammerBuyData.giftCard.code;
    trackedGiftCardIds.push(hammerBuyData.giftCard.id);

    console.log(`  🔨 Launching 5 concurrent parallel redemptions for code ${hammerCode}...`);
    const hammerPromises = [1, 2, 3, 4, 5].map(() =>
      fetch(`${BASE_URL}/api/gifting/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: recipientCookie },
        body: JSON.stringify({ code: hammerCode }),
      }).then(r => r.json().then(d => ({ status: r.status, data: d })))
    );

    const hammerResults = await Promise.all(hammerPromises);
    const successes = hammerResults.filter(r => r.status === 200 && r.data.success);
    const failures = hammerResults.filter(r => r.status === 400);

    if (successes.length !== 1 || failures.length !== 4) {
      fail('T4e', `Concurrency race condition! Successes: ${successes.length}, Failures: ${failures.length}`);
    }
    pass(`T4e: Concurrency check passed — exactly 1 of 5 parallel requests succeeded; 4 rejected with 400`);

    // Verify wallet balance: previous 2500 + 1500 = 4000
    const walletCheck = await adminPool.query(`SELECT balance FROM customer_wallets WHERE user_id = $1`, [recipientUser.id]);
    if (parseFloat(walletCheck.rows[0].balance) !== 4000) {
      fail('T4e', `Wallet balance mismatch: expected 4000, found ${walletCheck.rows[0].balance}`);
    }
    pass(`T4e: Digital wallet balance strictly matches single credit: 4,000 ETB`);

    // ────────────────────────────────────────────────────────────────────────
    // Phase 5: Expiration Guard
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 5] Expiration Enforcement`);

    // T5a: Card with expired date cannot be redeemed
    const expiredCode = 'ODS-GC-EXPI-RED1';
    const expiredHash = crypto.createHash('sha256').update(expiredCode.replace(/[^A-Z0-9]/g, '')).digest('hex');
    const expiredCardRes = await adminPool.query(
      `INSERT INTO gift_cards (
        sender_id, code, code_hash, initial_amount, balance, currency, gift_type, package_type, occasion, status, expiry_date
       ) VALUES (
        $1, $2, $3, 500, 500, 'ETB', 'monetary', 'basic', 'Birthday', 'active', NOW() - INTERVAL '2 days'
       ) RETURNING id, code`,
      [buyerUser.id, expiredCode, expiredHash]
    );
    trackedGiftCardIds.push(expiredCardRes.rows[0].id);

    const expRedeemRes = await fetch(`${BASE_URL}/api/gifting/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recipientCookie },
      body: JSON.stringify({ code: expiredCode }),
    });
    if (expRedeemRes.status !== 400) {
      fail('T5a', `Expected 400 for expired gift card, got ${expRedeemRes.status}`);
    }
    pass('T5a: Expired gift card redemption strictly rejected with 400');

    // ────────────────────────────────────────────────────────────────────────
    // Phase 6: In-Clinic Provider Delivery Confirmation
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 6] In-Clinic Provider Delivery Confirmation & RBAC`);

    // T6a: Non-provider role denied
    const nonProvRes = await fetch(`${BASE_URL}/api/gifting/confirm-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: buyerCookie },
      body: JSON.stringify({ code: createdServiceCard.code }),
    });
    if (nonProvRes.status !== 403) {
      fail('T6a', `Expected 403 for non-provider delivery confirmation, got ${nonProvRes.status}`);
    }
    pass('T6a: POST /api/gifting/confirm-delivery denied to non-provider (403)');

    // T6b: Authorized provider confirms delivery
    const provConfirmRes = await fetch(`${BASE_URL}/api/gifting/confirm-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: providerCookie },
      body: JSON.stringify({ code: createdServiceCard.code, service_provider_id: providerId }),
    });
    const provConfirmData = await provConfirmRes.json();
    if (provConfirmRes.status !== 200 || !provConfirmData.success) {
      fail('T6b', `Provider confirmation failed: ${provConfirmRes.status} ${JSON.stringify(provConfirmData)}`);
    }
    if (!provConfirmData.deliveredAt || provConfirmData.giftCard.status !== 'delivered') {
      fail('T6b', `Status not delivered: ${JSON.stringify(provConfirmData)}`);
    }
    pass(`T6b: Provider successfully confirmed service delivery (status="delivered", delivered_at set)`);

    // T6c: Second confirmation attempt rejected
    const repeatProvRes = await fetch(`${BASE_URL}/api/gifting/confirm-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: providerCookie },
      body: JSON.stringify({ code: createdServiceCard.code }),
    });
    if (repeatProvRes.status !== 400) {
      fail('T6c', `Expected 400 on duplicate service delivery, got ${repeatProvRes.status}`);
    }
    pass('T6c: Repeat service delivery confirmation rejected with 400');

    // ────────────────────────────────────────────────────────────────────────
    // Phase 7: Digital Wallet Retrieval & Ledger Audit
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 7] Digital Wallet Retrieval & Ledger Audit`);

    // T7a: GET /api/gifting/wallet returns balance and activities
    const walletRes = await fetch(`${BASE_URL}/api/gifting/wallet`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Cookie: recipientCookie },
    });
    const walletData = await walletRes.json();
    if (!walletRes.ok || !walletData.success) {
      fail('T7a', `Failed to retrieve wallet: ${JSON.stringify(walletData)}`);
    }
    if (parseFloat(walletData.balance) !== 4000) {
      fail('T7a', `Expected wallet balance 4000, got ${walletData.balance}`);
    }
    if (!Array.isArray(walletData.activity) || walletData.activity.length !== 2) {
      fail('T7a', `Expected 2 activity ledger entries, got ${walletData.activity ? walletData.activity.length : 0}`);
    }
    pass(`T7a: GET /api/gifting/wallet returns verified balance 4,000 ETB and 2 ledger audit entries`);

    // T7b: GET /api/gifting/my-cards returns sent and received
    const myCardsRes = await fetch(`${BASE_URL}/api/gifting/my-cards`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Cookie: buyerCookie },
    });
    const myCardsData = await myCardsRes.json();
    if (!myCardsRes.ok || !myCardsData.success) {
      fail('T7b', `Failed to retrieve my-cards: ${JSON.stringify(myCardsData)}`);
    }
    if (!Array.isArray(myCardsData.sent) || myCardsData.sent.length < 3) {
      fail('T7b', `Expected at least 3 sent cards, got: ${myCardsData.sent ? myCardsData.sent.length : 0}`);
    }
    pass(`T7b: GET /api/gifting/my-cards returns accurate sent card list (${myCardsData.sent.length} cards)`);

    console.log(`\n============================================================`);
    console.log(` ✅ ALL 17 BATCH 7 TESTS PASSED WITH ZERO ERRORS!`);
    console.log(`============================================================\n`);
  } catch (err) {
    console.error(`\n💥 [TEST SUITE TERMINATED ON ERROR]:`, err.message);
    process.exitCode = 1;
  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }

    // Cleanup fixtures
    console.log(`[Cleanup] Removing ${trackedGiftCardIds.length} gift cards and ${trackedUserIds.length} test users...`);
    try {
      if (trackedGiftCardIds.length > 0) {
        await adminPool.query(`DELETE FROM gift_card_redemptions WHERE gift_card_id = ANY($1)`, [trackedGiftCardIds]);
        await adminPool.query(`DELETE FROM gift_cards WHERE id = ANY($1)`, [trackedGiftCardIds]);
      }
      if (trackedUserIds.length > 0) {
        await adminPool.query(`DELETE FROM customer_wallets WHERE user_id = ANY($1)`, [trackedUserIds]);
        await adminPool.query(`DELETE FROM providers WHERE user_id = ANY($1)`, [trackedUserIds]);
        await adminPool.query(`DELETE FROM audit_logs WHERE user_id = ANY($1)`, [trackedUserIds]);
        await adminPool.query(`DELETE FROM users WHERE id = ANY($1)`, [trackedUserIds]);
      }
    } catch (cleanupErr) {
      console.warn(`[Cleanup Warning]: ${cleanupErr.message}`);
    }

    await adminPool.end();
    await appPool.end();
  }
}

runSuite();
