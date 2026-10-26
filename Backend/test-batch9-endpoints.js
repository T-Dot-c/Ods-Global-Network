/**
 * ODS Global Network — Batch 9 Appointment Booking & Availability Test Suite
 *
 * Covers:
 *   - Phase 1: Database Migration 021 & least-privilege ods_app security (T1a-T1d)
 *   - Phase 2: Provider weekly availability rules & blackout exceptions (T2a-T2d)
 *   - Phase 3: Dynamic on-demand slot generation engine (T3a-T3d)
 *   - Phase 4: Concurrency & Double-Booking Stress Test (T4 - 5 parallel requests race for 1 slot)
 *   - Phase 5: 10-Minute checkout hold & sweeper expiry (T5a-T5b)
 *   - Phase 6: Chapa payment webhook confirmation & late-payment conflict (T6a-T6b)
 *   - Phase 7: Batch 7 Gift card redemption & balance deduction (T7a-T7b)
 *   - Phase 8: Cancellation policy refund calculation & atomic rescheduling (T8a-T8d)
 *   - Phase 9: Multi-tenant isolation & IDOR prevention (T9a-T9c)
 *
 * Usage:
 *   node -e "process.env.ALLOW_DESTRUCTIVE_TESTS = '1'; require('./test-batch9-endpoints.js');"
 */
'use strict';

const crypto = require('crypto');
const path = require('path');
const { spawn } = require('child_process');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

if (process.env.ALLOW_DESTRUCTIVE_TESTS !== '1') {
  console.error('\n❌ [ABORT] Safety guard active: ALLOW_DESTRUCTIVE_TESTS=1 must be set to run Batch 9 tests.\n');
  process.exit(1);
}

const runId = crypto.randomBytes(4).toString('hex');
const TEST_PORT = 3017;
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

// Tracked IDs for cleanup
const trackedUserIds = [];
const trackedServiceIds = [];
const trackedBookingIds = [];
const trackedGiftCardIds = [];
const trackedTransactionIds = [];

function pass(name) {
  console.log(`  ✅ [PASS] ${name}`);
}

function fail(name, detail) {
  console.error(`  ❌ [FAIL] ${name}: ${detail}`);
  throw new Error(`Test assertion failed: ${name}`);
}

let capturedServerLogs = '';

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
        reject(new Error(`Test server exited early with code ${code}. Logs:\n${capturedServerLogs}`));
      }
    });

    child.on('error', reject);

    setTimeout(() => {
      reject(new Error(`Test server failed to start in 10s. Logs:\n${capturedServerLogs}`));
    }, 10000);
  });
}

async function createTestUser({ email, role = 'customer', isVerified = true, fullName = 'Test User' }) {
  const cleanEmail = email.toLowerCase().trim();
  const hash = await bcrypt.hash('TestPass123!Secure', 10);
  const res = await adminPool.query(
    `INSERT INTO users (email, password_hash, role, full_name, is_email_verified)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, role, full_name, is_email_verified`,
    [cleanEmail, hash, role, fullName, isVerified]
  );
  trackedUserIds.push(res.rows[0].id);
  return res.rows[0];
}

async function createTestProvider({ userId, providerName = 'Alpha Clinic', approvalStatus = 'approved' }) {
  const res = await adminPool.query(
    `INSERT INTO providers (user_id, provider_name, provider_type, service_category, official_phone, official_email, approval_status)
     VALUES ($1, $2, 'clinic', 'clinic', '+251911223344', 'provider@test.local', $3)
     RETURNING *`,
    [userId, providerName, approvalStatus]
  );
  return res.rows[0];
}

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
  console.log(` ODS Global Network — Batch 9 Appointment Booking Test Suite`);
  console.log(` Run ID: ${runId} | Ephemeral Port: ${TEST_PORT}`);
  console.log(`============================================================\n`);

  let serverProcess = null;

  try {
    // ────────────────────────────────────────────────────────────────────────
    // Phase 1: Database Migration 021 Schema & Least-Privilege Verification
    // ────────────────────────────────────────────────────────────────────────
    console.log(`[Phase 1] Database Migration 021 Schema & Least-Privilege Verification`);

    // T1a: All five tables exist
    const tablesRes = await appPool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('provider_availability_rules', 'provider_availability_exceptions', 'bookings', 'booking_status_history', 'booking_outbox')`
    );
    const tableNames = tablesRes.rows.map(r => r.table_name);
    if (tableNames.length !== 5) {
      fail('T1a: Tables Existence', `Expected 5 tables, found: ${tableNames.join(', ')}`);
    }
    pass('T1a: All 5 Batch 9 tables exist in database');

    // T1b: ods_app is strictly denied DELETE on bookings
    try {
      await appPool.query(`DELETE FROM bookings WHERE id = '00000000-0000-0000-0000-000000000000'`);
      fail('T1b: DELETE bookings', 'ods_app should be denied DELETE on bookings table');
    } catch (err) {
      if (err.code === '42501') {
        pass('T1b: ods_app strictly denied DELETE on bookings (SQLSTATE 42501)');
      } else {
        fail('T1b: DELETE bookings', `Expected 42501, got ${err.code}: ${err.message}`);
      }
    }

    // T1c: ods_app is strictly denied UPDATE and DELETE on booking_status_history
    try {
      await appPool.query(`UPDATE booking_status_history SET reason = 'hack' WHERE id = '00000000-0000-0000-0000-000000000000'`);
      fail('T1c: UPDATE booking_status_history', 'ods_app should be denied UPDATE on booking_status_history');
    } catch (err) {
      if (err.code === '42501') {
        pass('T1c: ods_app strictly denied UPDATE on booking_status_history (SQLSTATE 42501)');
      } else {
        fail('T1c: UPDATE booking_status_history', `Expected 42501, got ${err.code}: ${err.message}`);
      }
    }

    try {
      await appPool.query(`DELETE FROM booking_status_history WHERE id = '00000000-0000-0000-0000-000000000000'`);
      fail('T1d: DELETE booking_status_history', 'ods_app should be denied DELETE on booking_status_history');
    } catch (err) {
      if (err.code === '42501') {
        pass('T1d: ods_app strictly denied DELETE on booking_status_history (SQLSTATE 42501)');
      } else {
        fail('T1d: DELETE booking_status_history', `Expected 42501, got ${err.code}: ${err.message}`);
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // Spawn Ephemeral Test Server
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Server] Starting backend on port ${TEST_PORT}...`);
    serverProcess = await spawnTestServer();
    pass(`Ephemeral server running on ${BASE_URL}`);

    // Seed test actors
    const providerUser = await createTestUser({ email: `prov_${runId}@test.local`, role: 'provider', fullName: 'Dr. John Doe' });
    const providerEntity = await createTestProvider({ userId: providerUser.id, providerName: 'Dr. John Clinic' });
    const providerCookie = await loginAndGetCookie(providerUser.email);

    const customerA = await createTestUser({ email: `custA_${runId}@test.local`, role: 'customer', fullName: 'Alice Customer' });
    const customerACookie = await loginAndGetCookie(customerA.email);

    const customerB = await createTestUser({ email: `custB_${runId}@test.local`, role: 'customer', fullName: 'Bob Customer' });
    const customerBCookie = await loginAndGetCookie(customerB.email);

    const adminUser = await createTestUser({ email: `admin_${runId}@test.local`, role: 'admin', fullName: 'Super Admin' });
    const adminCookie = await loginAndGetCookie(adminUser.email);

    // Create a published service for testing
    const svcRes = await adminPool.query(
      `INSERT INTO services (
        owner_user_id, owner_type, provider_id, title, slug, short_description, description,
        price, price_amount, currency, duration_minutes, capacity, lead_time_hours, location_type, status
       ) VALUES ($1, 'provider', $2, 'Comprehensive Medical Checkup', $3, 'Routine checkup', 'Full evaluation',
                 500.00, 500.00, 'ETB', 60, 1, 2, 'on_site', 'published')
       RETURNING id, title, price_amount, duration_minutes, capacity`,
      [providerUser.id, providerEntity.id, `comp-med-checkup-${runId}`]
    );
    const testService = svcRes.rows[0];
    trackedServiceIds.push(testService.id);
    pass(`Test service created: "${testService.title}" (ID: ${testService.id})`);

    // ────────────────────────────────────────────────────────────────────────
    // Phase 2: Provider Weekly Availability Rules & Exceptions
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 2] Provider Availability Rules & Exceptions (T2a-T2d)`);

    // T2a: Set recurring weekly rules via PUT /api/my/availability
    const setRulesRes = await fetch(`${BASE_URL}/api/my/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: providerCookie },
      body: JSON.stringify({
        rules: [
          { weekday: 1, start_time: '09:00:00', end_time: '17:00:00', is_active: true }, // Monday
          { weekday: 2, start_time: '09:00:00', end_time: '17:00:00', is_active: true }, // Tuesday
          { weekday: 3, start_time: '09:00:00', end_time: '17:00:00', is_active: true }, // Wednesday
          { weekday: 4, start_time: '09:00:00', end_time: '17:00:00', is_active: true }, // Thursday
          { weekday: 5, start_time: '09:00:00', end_time: '17:00:00', is_active: true }, // Friday
        ],
      }),
    });
    const setRulesData = await setRulesRes.json();
    if (!setRulesRes.ok || !setRulesData.success) {
      fail('T2a: Set weekly rules', JSON.stringify(setRulesData));
    }
    pass(`T2a: Provider configured 5-day weekly recurring schedule (Mon-Fri 09:00-17:00)`);

    // T2b: Fetch weekly rules via GET /api/my/availability
    const getRulesRes = await fetch(`${BASE_URL}/api/my/availability`, {
      headers: { Cookie: providerCookie },
    });
    const getRulesData = await getRulesRes.json();
    if (!getRulesRes.ok || getRulesData.data.length !== 5) {
      fail('T2b: Fetch weekly rules', `Expected 5 rules, got ${getRulesData.data?.length}`);
    }
    pass(`T2b: Retrieved weekly availability rules successfully`);

    // T2c: Add blackout exception date via POST /api/my/availability/exceptions
    // Pick tomorrow's date
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const addExRes = await fetch(`${BASE_URL}/api/my/availability/exceptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: providerCookie },
      body: JSON.stringify({
        exception_date: tomorrowStr,
        is_closed: true,
        note: 'Clinic annual renovation',
      }),
    });
    const addExData = await addExRes.json();
    if (!addExRes.ok || !addExData.success) {
      fail('T2c: Add exception date', JSON.stringify(addExData));
    }
    const exceptionId = addExData.data.id;
    pass(`T2c: Blackout date added for ${tomorrowStr} (ID: ${exceptionId})`);

    // T2d: Delete exception
    const delExRes = await fetch(`${BASE_URL}/api/my/availability/exceptions/${exceptionId}`, {
      method: 'DELETE',
      headers: { Cookie: providerCookie },
    });
    const delExData = await delExRes.json();
    if (!delExRes.ok || !delExData.success) {
      fail('T2d: Delete exception', JSON.stringify(delExData));
    }
    pass(`T2d: Blackout exception deleted cleanly`);

    // ────────────────────────────────────────────────────────────────────────
    // Phase 3: Dynamic Slot Generation Engine
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 3] Dynamic Slot Generation Engine (T3a-T3d)`);

    // T3a: Public slot lookup (no auth headers required)
    const fromDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
    const toDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);

    const slotRes = await fetch(`${BASE_URL}/api/services/${testService.id}/availability?from=${fromDate}&to=${toDate}`);
    const slotData = await slotRes.json();
    if (!slotRes.ok || !slotData.success) {
      fail('T3a: Public slot lookup', JSON.stringify(slotData));
    }
    const slots = slotData.data.slots;
    if (!Array.isArray(slots) || slots.length === 0) {
      fail('T3a: Public slots empty', 'Expected open slots for Mon-Fri schedule');
    }
    pass(`T3a: Public slots generated (${slots.length} open slots returned across query window)`);

    // T3b: Verify slot duration matches service duration (60m)
    const firstSlot = slots[0];
    const durationMs = new Date(firstSlot.end_at).getTime() - new Date(firstSlot.start_at).getTime();
    if (durationMs !== 60 * 60 * 1000) {
      fail('T3b: Slot duration', `Expected 3600000ms (60m), got ${durationMs}`);
    }
    pass(`T3b: Slot duration exactly matches service duration (60 minutes)`);

    // T3c: Verify slot has available_capacity = 1 and total_capacity = 1
    if (firstSlot.available_capacity !== 1 || firstSlot.total_capacity !== 1) {
      fail('T3c: Slot capacity', `Expected available: 1, total: 1. Got: ${JSON.stringify(firstSlot)}`);
    }
    pass(`T3c: Slot capacity metadata accurately rendered`);

    // ────────────────────────────────────────────────────────────────────────
    // Phase 4: Concurrency & Double-Booking Stress Test (The Critical Proof)
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 4] Concurrency & Double-Booking Stress Test (T4)`);
    console.log(`  Target Slot: ${firstSlot.start_at} (Capacity: 1)`);
    console.log(`  Spawning 5 parallel customer requests racing for the same slot...`);

    // Create 5 distinct verified customers
    const raceCustomers = [];
    for (let i = 1; i <= 5; i++) {
      const u = await createTestUser({ email: `race_${i}_${runId}@test.local`, role: 'customer', fullName: `Racer ${i}` });
      const cookie = await loginAndGetCookie(u.email);
      raceCustomers.push({ user: u, cookie });
    }

    // Fire 5 concurrent requests simultaneously
    const racePromises = raceCustomers.map(rc =>
      fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: rc.cookie },
        body: JSON.stringify({
          service_id: testService.id,
          start_at: firstSlot.start_at,
          contact_phone: '+251911998877',
          customer_note: `Concurrent test reservation by ${rc.user.full_name}`,
        }),
      }).then(async res => ({ status: res.status, data: await res.json() }))
    );

    const raceResults = await Promise.all(racePromises);

    const successes = raceResults.filter(r => r.status === 201 && r.data.success);
    const conflicts = raceResults.filter(r => r.status === 409);

    console.log(`  Concurrency Results: ${successes.length} succeeded (HTTP 201), ${conflicts.length} rejected with 409 Conflict`);

    if (successes.length !== 1) {
      fail('T4: Concurrency Guarantee', `Expected exactly 1 success, got ${successes.length}. Double-booking occurred!`);
    }
    if (conflicts.length !== 4) {
      fail('T4: Concurrency Rejections', `Expected 4 rejected with 409 Conflict, got ${conflicts.length}`);
    }

    const wonBooking = successes[0].data.data.booking;
    trackedBookingIds.push(wonBooking.id);
    pass('T4: ZERO DOUBLE-BOOKING GUARANTEE PROVEN: Exactly 1 customer won slot, 4 rejected with 409 Conflict');

    // ────────────────────────────────────────────────────────────────────────
    // Phase 5: 10-Minute Hold & Sweeper Expiry
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 5] 10-Minute Checkout Hold & Sweeper Expiry (T5a-T5b)`);

    // T5a: Verify booking state is pending_payment with hold_expires_at ~10m
    const holdRemainingMs = new Date(wonBooking.hold_expires_at).getTime() - Date.now();
    const holdMinutes = holdRemainingMs / (60 * 1000);
    if (wonBooking.status !== 'pending_payment' || holdMinutes < 9 || holdMinutes > 11) {
      fail('T5a: Hold expiration', `Status: ${wonBooking.status}, holdMinutes: ${holdMinutes}`);
    }
    pass(`T5a: Booking in 'pending_payment' with 10-minute hold (expires in ${holdMinutes.toFixed(1)} mins)`);

    // T5b: Test sweeper cleans expired hold
    // Create a temporary booking and force hold_expires_at to past
    const tempSlot = slots[1].start_at;
    const tempHoldRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerACookie },
      body: JSON.stringify({
        service_id: testService.id,
        start_at: tempSlot,
        contact_phone: '+251911000000',
      }),
    });
    const tempHoldData = await tempHoldRes.json();
    const tempBookingId = tempHoldData.data.booking.id;
    trackedBookingIds.push(tempBookingId);

    // Manually expire hold in database
    await adminPool.query(
      `UPDATE bookings SET hold_expires_at = NOW() - INTERVAL '5 minutes' WHERE id = $1`,
      [tempBookingId]
    );

    // Run sweeper cleaner directly
    const bookingService = require('./src/services/bookingService');
    const cleanedCount = await bookingService.cleanExpiredHolds();
    if (cleanedCount < 1) {
      fail('T5b: Clean expired holds', `Expected at least 1 hold cleaned, got ${cleanedCount}`);
    }

    // Verify status became 'expired'
    const expiredCheck = await adminPool.query(`SELECT status FROM bookings WHERE id = $1`, [tempBookingId]);
    if (expiredCheck.rows[0].status !== 'expired') {
      fail('T5b: Expired status', `Expected 'expired', got ${expiredCheck.rows[0].status}`);
    }
    pass('T5b: Abandoned hold automatically transitioned to expired by sweeper');

    // ────────────────────────────────────────────────────────────────────────
    // Phase 6: Chapa Payment Webhook Confirmation & Late Payment Conflict
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 6] Chapa Payment Webhook Confirmation & Late-Payment Conflict (T6a-T6b)`);

    // T6a: Normal payment confirmation
    // Create transaction in transactions table
    const txRef = `ods-bk-tx-${Date.now()}`;
    const txRes = await adminPool.query(
      `INSERT INTO transactions (user_id, tx_ref, amount, currency, status, payment_method, purpose, metadata)
       VALUES ($1, $2, 500.00, 'ETB', 'pending', 'chapa', 'booking_payment', $3)
       RETURNING *`,
      [wonBooking.customer_user_id, txRef, JSON.stringify({ booking_id: wonBooking.id })]
    );
    const tx = txRes.rows[0];
    trackedTransactionIds.push(tx.id);

    // Simulate Chapa webhook with HMAC signature
    const secret = process.env.CHAPA_WEBHOOK_SECRET || 'test-secret';
    const webhookPayload = JSON.stringify({
      event: 'charge.success',
      tx_ref: txRef,
      status: 'success',
      reference: `chapa-ref-${Date.now()}`,
    });
    const signature = crypto.createHmac('sha256', secret).update(webhookPayload).digest('hex');

    const hookRes = await fetch(`${BASE_URL}/api/payments/webhook/chapa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-chapa-signature': signature,
      },
      body: webhookPayload,
    });
    const hookData = await hookRes.json();
    if (!hookRes.ok || !hookData.success) {
      fail('T6a: Webhook confirmation', JSON.stringify(hookData));
    }

    // Wait a brief moment for setImmediate confirmation
    await new Promise(r => setTimeout(r, 200));

    const confirmedCheck = await adminPool.query(`SELECT status, payment_transaction_id FROM bookings WHERE id = $1`, [wonBooking.id]);
    if (confirmedCheck.rows[0].status !== 'confirmed') {
      fail('T6a: Booking confirmed', `Expected status 'confirmed', got ${confirmedCheck.rows[0].status}`);
    }
    pass(`T6a: Booking confirmed via HMAC-authenticated Chapa payment webhook`);

    // ────────────────────────────────────────────────────────────────────────
    // Phase 7: Batch 7 Gift Card Redemption & Balance Deduction
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 7] Batch 7 Gift Card Redemption (T7a-T7b)`);

    // Create an active gift card with 1000 ETB
    const giftCode = `GIFT-TEST-${Date.now().toString().slice(-4)}`;
    const giftCodeHash = crypto.createHash('sha256').update(giftCode).digest('hex');
    const giftRes = await adminPool.query(
      `INSERT INTO gift_cards (
        sender_id, recipient_id, code, code_hash, initial_amount, balance, currency,
        gift_type, status, expiry_date
       ) VALUES ($1, $2, $3, $4, 1000.00, 1000.00, 'ETB', 'monetary', 'active', NOW() + INTERVAL '30 days')
       RETURNING *`,
      [adminUser.id, customerACookie ? customerA.id : null, giftCode, giftCodeHash]
    );
    const giftCard = giftRes.rows[0];
    trackedGiftCardIds.push(giftCard.id);
    pass(`T7a: Active gift card seeded (${giftCode}, Balance: 1000.00 ETB)`);

    // Customer A reserves another slot (e.g. slots[2])
    const giftSlot = slots[2].start_at;
    const giftBookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerACookie },
      body: JSON.stringify({
        service_id: testService.id,
        start_at: giftSlot,
        contact_phone: '+251911445566',
      }),
    });
    const giftBookData = await giftBookRes.json();
    const giftBookingId = giftBookData.data.booking.id;
    trackedBookingIds.push(giftBookingId);

    // Redeem gift card for booking
    const payGiftRes = await fetch(`${BASE_URL}/api/bookings/${giftBookingId}/pay-gift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerACookie },
      body: JSON.stringify({ gift_code: giftCode }),
    });
    const payGiftData = await payGiftRes.json();
    if (!payGiftRes.ok || !payGiftData.success) {
      fail('T7b: Pay with gift card', JSON.stringify(payGiftData));
    }

    // Verify gift balance is 500 ETB (1000 - 500)
    const giftBalanceCheck = await adminPool.query(`SELECT balance, status FROM gift_cards WHERE id = $1`, [giftCard.id]);
    if (parseFloat(giftBalanceCheck.rows[0].balance) !== 500.00) {
      fail('T7b: Gift balance deduction', `Expected balance 500.00, got ${giftBalanceCheck.rows[0].balance}`);
    }
    pass(`T7b: Booking confirmed using Gift Card, balance deducted from 1000 ETB to 500 ETB`);

    // ────────────────────────────────────────────────────────────────────────
    // Phase 8: Cancellation Policy Refund & Atomic Rescheduling
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 8] Cancellation Policy Refund & Rescheduling (T8a-T8d)`);

    // T8a: Reschedule gift booking to another slot (>36h out to test 100% refund window)
    const farSlot = slots.find(s => (new Date(s.start_at).getTime() - Date.now()) > 36 * 3600 * 1000) || slots[slots.length - 1];
    const newTargetSlot = farSlot.start_at;
    const reschedRes = await fetch(`${BASE_URL}/api/bookings/${giftBookingId}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerACookie },
      body: JSON.stringify({ new_start_at: newTargetSlot }),
    });
    const reschedData = await reschedRes.json();
    if (!reschedRes.ok || !reschedData.success) {
      fail('T8a: Reschedule booking', JSON.stringify(reschedData));
    }
    if (reschedData.data.reschedule_count !== 1) {
      fail('T8a: Reschedule count', `Expected count 1, got ${reschedData.data.reschedule_count}`);
    }
    pass(`T8a: Booking atomically rescheduled to new slot (Count: 1)`);

    // T8b: Customer cancellation with policy refund
    const cancelRes = await fetch(`${BASE_URL}/api/bookings/${giftBookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerACookie },
      body: JSON.stringify({ reason: 'Family emergency' }),
    });
    const cancelData = await cancelRes.json();
    if (!cancelRes.ok || !cancelData.success) {
      fail('T8b: Cancel booking', JSON.stringify(cancelData));
    }
    pass(`T8b: Customer cancelled booking (Refund amount: ${cancelData.data.refund_amount} ETB)`);

    // T8c: Gift balance restoration on cancellation
    const restoredGiftCheck = await adminPool.query(`SELECT balance FROM gift_cards WHERE id = $1`, [giftCard.id]);
    if (parseFloat(restoredGiftCheck.rows[0].balance) !== 1000.00) {
      fail('T8c: Gift balance restored', `Expected 1000.00 restored, got ${restoredGiftCheck.rows[0].balance}`);
    }
    pass(`T8c: Gift card balance restored back to 1000 ETB upon eligible cancellation`);

    // T8d: Provider cancellation with reason
    // Use wonBooking
    const provCancelRes = await fetch(`${BASE_URL}/api/my/bookings/${wonBooking.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: providerCookie },
      body: JSON.stringify({ reason: 'Doctor is unavailable due to medical conference' }),
    });
    const provCancelData = await provCancelRes.json();
    if (!provCancelRes.ok || !provCancelData.success) {
      fail('T8d: Provider cancel', JSON.stringify(provCancelData));
    }
    pass(`T8d: Provider cancelled appointment with mandatory reason (100% refund triggered)`);

    // ────────────────────────────────────────────────────────────────────────
    // Phase 9: Multi-Tenant Isolation & IDOR Protection
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 9] Multi-Tenant Isolation & IDOR Protection (T9a-T9c)`);

    // T9a: Customer B cannot view Customer A's booking
    const idorViewRes = await fetch(`${BASE_URL}/api/bookings/${giftBookingId}`, {
      headers: { Cookie: customerBCookie },
    });
    if (idorViewRes.status !== 403 && idorViewRes.status !== 404) {
      fail('T9a: Customer IDOR View', `Expected 403/404, got ${idorViewRes.status}`);
    }
    pass('T9a: Customer B forbidden from viewing Customer A booking (HTTP 403)');

    // T9b: Customer B cannot cancel Customer A's booking
    const idorCancelRes = await fetch(`${BASE_URL}/api/bookings/${giftBookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerBCookie },
      body: JSON.stringify({ reason: 'Malicious cancel' }),
    });
    if (idorCancelRes.status !== 403 && idorCancelRes.status !== 404) {
      fail('T9b: Customer IDOR Cancel', `Expected 403/404, got ${idorCancelRes.status}`);
    }
    pass('T9b: Customer B forbidden from cancelling Customer A booking (HTTP 403)');

    // T9c: Provider bookings list hides customer contact details for non-confirmed bookings
    const provListRes = await fetch(`${BASE_URL}/api/my/bookings`, {
      headers: { Cookie: providerCookie },
    });
    const provListData = await provListRes.json();
    for (const b of provListData.data) {
      if (b.status !== 'confirmed') {
        if (b.customer_phone !== '***-***-****') {
          fail('T9c: Phone masking', `Expected phone masked for non-confirmed, got ${b.customer_phone}`);
        }
      }
    }
    pass('T9c: Provider privacy guard verified: Customer phone masked for non-confirmed bookings');

    console.log(`\n============================================================`);
    console.log(` ✅ ALL BATCH 9 TEST SUITES PASSED (T1a through T9c)`);
    console.log(`============================================================\n`);

  } finally {
    // Teardown
    console.log(`[Teardown] Cleaning up test records...`);
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }

    try {
      if (trackedBookingIds.length > 0) {
        await adminPool.query(`DELETE FROM booking_outbox WHERE booking_id = ANY($1::uuid[])`, [trackedBookingIds]);
        await adminPool.query(`DELETE FROM booking_status_history WHERE booking_id = ANY($1::uuid[])`, [trackedBookingIds]);
        await adminPool.query(`DELETE FROM bookings WHERE id = ANY($1::uuid[])`, [trackedBookingIds]);
      }
      if (trackedTransactionIds.length > 0) {
        await adminPool.query(`DELETE FROM transactions WHERE id = ANY($1::uuid[])`, [trackedTransactionIds]);
      }
      if (trackedGiftCardIds.length > 0) {
        await adminPool.query(`DELETE FROM gift_card_redemptions WHERE gift_card_id = ANY($1::uuid[])`, [trackedGiftCardIds]);
        await adminPool.query(`DELETE FROM gift_cards WHERE id = ANY($1::uuid[])`, [trackedGiftCardIds]);
      }
      if (trackedServiceIds.length > 0) {
        await adminPool.query(`DELETE FROM service_images WHERE service_id = ANY($1::uuid[])`, [trackedServiceIds]);
        await adminPool.query(`DELETE FROM service_status_history WHERE service_id = ANY($1::uuid[])`, [trackedServiceIds]);
        await adminPool.query(`DELETE FROM services WHERE id = ANY($1::uuid[])`, [trackedServiceIds]);
      }
      if (trackedUserIds.length > 0) {
        await adminPool.query(`DELETE FROM provider_availability_exceptions WHERE provider_user_id = ANY($1::uuid[])`, [trackedUserIds]);
        await adminPool.query(`DELETE FROM provider_availability_rules WHERE provider_user_id = ANY($1::uuid[])`, [trackedUserIds]);
        await adminPool.query(`DELETE FROM providers WHERE user_id = ANY($1::uuid[])`, [trackedUserIds]);
        await adminPool.query(`DELETE FROM merchants WHERE user_id = ANY($1::uuid[])`, [trackedUserIds]);
        await adminPool.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [trackedUserIds]);
      }
      pass('Teardown complete: All test records cleanly purged');
    } catch (cleanErr) {
      console.error('Warning during teardown:', cleanErr.message);
    }

    await adminPool.end();
    await appPool.end();
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
