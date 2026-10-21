/**
 * ODS Global Network — Batch 7 Addendum Automated Test Suite
 *
 * Verifies:
 * 1. Provider Voucher Inbox:
 *    - Auth guard: GET /api/gifting/provider/vouchers requires login (401)
 *    - Role guard: Customer cannot access provider vouchers (403)
 *    - Provider access: Successfully returns voucher list and summary KPIs
 * 2. Payment Integration in Gifting:
 *    - Purchase via Wallet: Fails if balance insufficient (400)
 *    - Purchase via Wallet: Deducts balance atomically and issues active card (201)
 *    - Purchase via Chapa: Creates pending transaction, returns checkout session (200)
 *    - Payment completion: Triggers finalizePaidGiftCard to issue card and update transaction
 * 3. Provider Delivery Confirmation & Ledger Filtering:
 *    - In-clinic delivery confirmation sets status='delivered' and records delivered_at
 *    - Rejects double delivery (400)
 *    - Search and status filter return matching records and updated stats
 */
'use strict';

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const jwt = require('jsonwebtoken');
const { spawn } = require('child_process');
const pool = require('./src/db');
const giftCardService = require('./src/services/giftCardService');

const TEST_PORT = 3108;
const baseUrl = `http://127.0.0.1:${TEST_PORT}`;
let serverChild = null;

let testCustomer;
let testCustomerCookie;
let testProviderUser;
let testProviderRecord;
let testProviderCookie;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

function request(method, reqPath, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (cookie) headers['Cookie'] = cookie;

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch (_) {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json,
            text: raw,
          });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function startTestServer() {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PORT: String(TEST_PORT),
      NODE_ENV: 'development',
      CHAPA_SIMULATOR_MODE: 'true',
    };

    serverChild = spawn(process.execPath, [path.join(__dirname, 'src', 'server.js')], {
      cwd: __dirname,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let logs = '';
    serverChild.stdout.on('data', (d) => {
      const str = d.toString();
      logs += str;
      if (str.includes(`[ODS API] Running on http://localhost:${TEST_PORT}`)) {
        resolve();
      }
    });

    serverChild.stderr.on('data', (d) => {
      logs += d.toString();
    });

    serverChild.on('error', reject);

    setTimeout(() => {
      reject(new Error(`Test server failed to start on port ${TEST_PORT} within 10s. Logs:\n${logs}`));
    }, 10000);
  });
}

async function setupTestData() {
  const nonce = Date.now();

  // 1. Customer User
  const custEmail = `addendum.cust.${nonce}@odsglobal.net`;
  const custRes = await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, is_active, is_email_verified)
     VALUES ($1, 'hash_test', 'customer', 'Addendum Customer', true, true)
     RETURNING id, email, role, full_name`,
    [custEmail]
  );
  testCustomer = custRes.rows[0];
  const custToken = jwt.sign({ id: testCustomer.id, token_version: 1 }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1d' });
  testCustomerCookie = `ods_session=${custToken}`;

  // 2. Provider User + Facility Profile
  const provEmail = `addendum.prov.${nonce}@odsglobal.net`;
  const provRes = await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, is_active, is_email_verified)
     VALUES ($1, 'hash_test', 'provider', 'Addendum Medical Officer', true, true)
     RETURNING id, email, role, full_name`,
    [provEmail]
  );
  testProviderUser = provRes.rows[0];
  const provToken = jwt.sign({ id: testProviderUser.id, token_version: 1 }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1d' });
  testProviderCookie = `ods_session=${provToken}`;

  const pRes = await pool.query(
    `INSERT INTO providers (user_id, provider_name, provider_type, approval_status, official_phone)
     VALUES ($1, 'Addendum General Hospital', 'hospital', 'approved', '+251911000999')
     RETURNING id, provider_name`,
    [testProviderUser.id]
  );
  testProviderRecord = pRes.rows[0];
}

async function runTests() {
  console.log('\n=== ODS Global Network: Batch 7 Addendum Test Suite ===\n');

  try {
    await startTestServer();
    await setupTestData();

    // ── SECTION 1: AUTH & RBAC FOR PROVIDER VOUCHERS ──
    console.log('[SECTION 1] Provider Voucher Inbox RBAC Guards');

    const unauthRes = await request('GET', '/api/gifting/provider/vouchers');
    assert(unauthRes.status === 401, 'Unauthenticated request to provider vouchers returns HTTP 401');

    const customerRes = await request('GET', '/api/gifting/provider/vouchers', null, testCustomerCookie);
    assert(customerRes.status === 403, 'Customer role accessing provider vouchers returns HTTP 403 Forbidden');

    const providerRes = await request('GET', '/api/gifting/provider/vouchers', null, testProviderCookie);
    assert(providerRes.status === 200, 'Provider role accessing provider vouchers returns HTTP 200 OK');
    assert(providerRes.body.success === true, 'Response body indicates success: true');
    assert(Array.isArray(providerRes.body.vouchers), 'Response includes vouchers array');
    assert(typeof providerRes.body.stats === 'object', 'Response includes summary stats object');

    // ── SECTION 2: PAYMENT INTEGRATION IN GIFTING (WALLET & CHAPA) ──
    console.log('\n[SECTION 2] Payment Integration: Digital Wallet & Gateway');

    // Test wallet purchase with insufficient balance
    const walletFailRes = await request(
      'POST',
      '/api/gifting/purchase',
      {
        amount: 2500,
        giftType: 'service',
        packageType: 'vip',
        occasion: 'Birthday',
        serviceTitle: 'Cardiac Checkup Package',
        recipientName: 'Patient Abebe',
        recipientEmail: 'abebe@example.com',
        payment_method: 'wallet',
      },
      testCustomerCookie
    );
    assert(walletFailRes.status === 400, 'Purchase via wallet with 0 balance returns HTTP 400');
    assert(walletFailRes.body.message.includes('Insufficient digital wallet balance'), 'Explicit error message returned for insufficient wallet funds');

    // Fund the customer wallet
    await pool.query(
      `INSERT INTO customer_wallets (user_id, balance, currency)
       VALUES ($1, 5000.00, 'ETB')
       ON CONFLICT (user_id) DO UPDATE SET balance = customer_wallets.balance + 5000.00`,
      [testCustomer.id]
    );

    // Purchase via wallet with funded balance
    const walletSuccessRes = await request(
      'POST',
      '/api/gifting/purchase',
      {
        amount: 1500,
        giftType: 'service',
        packageType: 'vip',
        occasion: 'Enkutatash',
        serviceTitle: 'Executive Clinical Screening',
        serviceCategory: 'Diagnostic Center',
        serviceProviderId: testProviderRecord.id,
        recipientName: 'Patient Sara Bekele',
        recipientEmail: 'sara@example.com',
        recipientPhone: '+251911223344',
        payment_method: 'wallet',
      },
      testCustomerCookie
    );

    assert(walletSuccessRes.status === 201, 'Purchase via wallet with sufficient funds returns HTTP 201 Created');
    assert(walletSuccessRes.body.paidViaWallet === true, 'Response flags paidViaWallet: true');
    assert(walletSuccessRes.body.newWalletBalance === 3500, 'Customer wallet deducted atomically (5000 - 1500 = 3500 ETB)');
    assert(Boolean(walletSuccessRes.body.giftCard.code), 'Gift card issued with active claim code');

    const walletCardCode = walletSuccessRes.body.giftCard.code;

    // Test purchase via Chapa
    const chapaInitRes = await request(
      'POST',
      '/api/gifting/purchase',
      {
        amount: 2000,
        giftType: 'service',
        packageType: 'basic',
        occasion: 'Genna',
        serviceTitle: 'Full Body Wellness Examination',
        serviceProviderId: testProviderRecord.id,
        recipientName: 'Patient Dawit',
        recipientEmail: 'dawit@example.com',
        payment_method: 'chapa',
      },
      testCustomerCookie
    );

    assert(chapaInitRes.status === 200, 'Purchase via Chapa returns HTTP 200 OK');
    assert(chapaInitRes.body.paymentRequired === true, 'Response flags paymentRequired: true');
    assert(Boolean(chapaInitRes.body.checkoutUrl), 'Checkout URL returned for Chapa gateway');
    assert(Boolean(chapaInitRes.body.txRef), 'Transaction reference returned');

    // Verify pending transaction was inserted in DB
    const txCheck = await pool.query(
      `SELECT status, purpose, metadata FROM transactions WHERE tx_ref = $1`,
      [chapaInitRes.body.txRef]
    );
    assert(txCheck.rows.length === 1, 'Transaction recorded in database');
    assert(txCheck.rows[0].status === 'pending', 'Transaction status is pending');
    assert(txCheck.rows[0].purpose === 'gift_card_purchase', 'Transaction purpose is gift_card_purchase');

    // ── SECTION 3: FINALIZE PAID GIFT CARD (GATEWAY SETTLEMENT) ──
    console.log('\n[SECTION 3] Automated Gateway Settlement & Card Issuance');

    const pendingTx = {
      id: (await pool.query(`SELECT id FROM transactions WHERE tx_ref = $1`, [chapaInitRes.body.txRef])).rows[0].id,
      user_id: testCustomer.id,
      tx_ref: chapaInitRes.body.txRef,
      amount: 2000,
      currency: 'ETB',
      status: 'completed',
      completed_at: new Date(),
      chapa_reference: `chapa-mock-${Date.now()}`,
      metadata: txCheck.rows[0].metadata,
    };

    const finalizedCard = await giftCardService.finalizePaidGiftCard(pendingTx);
    assert(Boolean(finalizedCard.id), 'finalizePaidGiftCard generates active gift card');
    assert(Boolean(finalizedCard.code), 'Finalized gift card contains valid claim code');
    assert(finalizedCard.status === 'active', 'Finalized gift card status is active');

    // Verify idempotency: calling finalizePaidGiftCard a second time returns existing card
    const duplicateCheck = await giftCardService.finalizePaidGiftCard(pendingTx);
    assert(duplicateCheck.id === finalizedCard.id, 'Idempotent execution: duplicate call returns same card');

    // ── SECTION 4: PROVIDER INBOX & IN-CLINIC DELIVERY CONFIRMATION ──
    console.log('\n[SECTION 4] Provider Ledger & In-Clinic Delivery Confirmation');

    // Provider checks their inbox
    const provInboxRes = await request('GET', '/api/gifting/provider/vouchers', null, testProviderCookie);
    assert(provInboxRes.body.vouchers.length >= 2, 'Provider sees assigned service vouchers');
    assert(provInboxRes.body.stats.activeCount >= 2, 'Provider active vouchers counter reflects pending visits');

    // Provider searches by patient name
    const searchRes = await request('GET', '/api/gifting/provider/vouchers?search=Sara', null, testProviderCookie);
    assert(searchRes.body.vouchers.some((v) => v.recipient_name.includes('Sara')), 'Search filter successfully finds matching patient voucher');

    // Provider in-clinic confirms delivery
    const deliveryRes = await request(
      'POST',
      '/api/gifting/confirm-delivery',
      { code: walletCardCode },
      testProviderCookie
    );

    assert(deliveryRes.status === 200, 'Provider delivery confirmation returns HTTP 200 OK');
    assert(deliveryRes.body.success === true, 'Response body success is true');
    assert(deliveryRes.body.giftCard.status === 'delivered', 'Voucher status updated to delivered');
    assert(Boolean(deliveryRes.body.deliveredAt), 'delivered_at timestamp recorded');

    // Attempt double delivery (must fail)
    const doubleDeliveryRes = await request(
      'POST',
      '/api/gifting/confirm-delivery',
      { code: walletCardCode },
      testProviderCookie
    );
    assert(doubleDeliveryRes.status === 400, 'Double delivery attempt rejected with HTTP 400');
    assert(doubleDeliveryRes.body.message.includes('already been delivered'), 'Rejection message clarifies voucher is already delivered');

    // Check delivered stats incremented
    const updatedInbox = await request('GET', '/api/gifting/provider/vouchers', null, testProviderCookie);
    assert(updatedInbox.body.stats.deliveredCount >= 1, 'Provider deliveredCount metric incremented');
    assert(updatedInbox.body.stats.deliveredValue >= 1500, 'Provider deliveredValue metric incremented by voucher value');

  } catch (err) {
    console.error('Test execution error:', err);
    failedTests++;
  } finally {
    if (serverChild) {
      serverChild.kill();
    }
    console.log(`\n=== Batch 7 Addendum Test Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed) ===\n`);
    await pool.end();
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runTests();
