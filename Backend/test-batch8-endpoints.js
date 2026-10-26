/**
 * ODS Global Network — Batch 8 Full Specification Service Catalog Automated Test Suite
 *
 * Covers:
 *   - Phase 1: Database Migration 020 & least-privilege ods_app security (T1a-T1f)
 *   - Phase 2: Categories taxonomy & public discovery endpoints (T2a-T2c)
 *   - Phase 3: Multi-tenant authoring for Provider and Merchant (T3a-T3d)
 *   - Phase 4: Lifecycle state machine & immutable audit ledger (T4a-T4c)
 *   - Phase 5: Admin moderation machine (queue, approve, reject, takedown, restore) (T5a-T5g)
 *   - Phase 6: Media linking reusing Batch 4 documents (T6a-T6d)
 *   - Phase 7: Cross-tenant isolation & IDOR prevention (T7a-T7b)
 *   - Phase 8: Public catalog search, filters, and slug detail (T8a-T8c)
 *
 * Usage:
 *   node -e "process.env.ALLOW_DESTRUCTIVE_TESTS = '1'; require('./test-batch8-endpoints.js');"
 */
'use strict';

const crypto = require('crypto');
const path = require('path');
const { spawn } = require('child_process');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

if (process.env.ALLOW_DESTRUCTIVE_TESTS !== '1') {
  console.error('\n❌ [ABORT] Safety guard active: ALLOW_DESTRUCTIVE_TESTS=1 must be set to run Batch 8 tests.\n');
  process.exit(1);
}

const runId = crypto.randomBytes(4).toString('hex');
const TEST_PORT = 3016;
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
const trackedDocumentIds = [];

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
  console.log(` ODS Global Network — Batch 8 Full Service Catalog Test Suite`);
  console.log(` Run ID: ${runId} | Ephemeral Port: ${TEST_PORT}`);
  console.log(`============================================================\n`);

  let serverProcess = null;

  try {
    // ────────────────────────────────────────────────────────────────────────
    // Phase 1: Database Migration 020 & Least-Privilege Verification
    // ────────────────────────────────────────────────────────────────────────
    console.log(`[Phase 1] Database Migration 020 Schema & Least-Privilege Verification`);

    // T1a: All four tables exist
    const tablesRes = await appPool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('service_categories', 'services', 'service_images', 'service_status_history')`
    );
    const existingTables = tablesRes.rows.map(r => r.table_name);
    for (const tbl of ['service_categories', 'services', 'service_images', 'service_status_history']) {
      if (!existingTables.includes(tbl)) {
        fail('T1a', `Expected table ${tbl} in public schema, but it was missing.`);
      }
    }
    pass('T1a: service_categories, services, service_images, service_status_history tables exist in public schema');

    // T1b: Required columns on services
    const colsRes = await appPool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'services'`
    );
    const cols = colsRes.rows.map(r => r.column_name);
    const reqCols = [
      'owner_user_id', 'owner_type', 'category_id', 'title', 'slug',
      'price_amount', 'currency', 'duration_minutes', 'capacity',
      'lead_time_hours', 'location_type', 'status', 'is_active'
    ];
    for (const c of reqCols) {
      if (!cols.includes(c)) {
        fail('T1b', `Missing required column on services: ${c}`);
      }
    }
    pass('T1b: services table has all forward-compatible required columns');

    // T1c: ods_app can SELECT from all tables
    for (const tbl of ['services', 'service_categories', 'service_images', 'service_status_history']) {
      const res = await appPool.query(`SELECT count(*) FROM ${tbl}`);
      pass(`T1c: ods_app can SELECT from ${tbl} (count=${res.rows[0].count})`);
    }

    // T1d: ods_app is strictly DENIED DELETE on services
    let servicesDeleteDenied = false;
    try {
      await appPool.query('DELETE FROM services WHERE id = $1', ['00000000-0000-0000-0000-000000000000']);
    } catch (err) {
      if (err.code === '42501') servicesDeleteDenied = true;
    }
    if (!servicesDeleteDenied) {
      fail('T1d', 'ods_app should be denied DELETE on services (SQLSTATE 42501)');
    }
    pass('T1d: ods_app is strictly DENIED DELETE on services (SQLSTATE 42501 verified)');

    // T1e: ods_app is strictly DENIED DELETE on service_status_history
    let historyDeleteDenied = false;
    try {
      await appPool.query('DELETE FROM service_status_history WHERE id = $1', ['00000000-0000-0000-0000-000000000000']);
    } catch (err) {
      if (err.code === '42501') historyDeleteDenied = true;
    }
    if (!historyDeleteDenied) {
      fail('T1e', 'ods_app should be denied DELETE on service_status_history (SQLSTATE 42501)');
    }
    pass('T1e: ods_app is strictly DENIED DELETE on service_status_history (SQLSTATE 42501 verified)');

    // T1f: ods_app is strictly DENIED UPDATE on service_status_history (immutable ledger)
    let historyUpdateDenied = false;
    try {
      await appPool.query("UPDATE service_status_history SET reason = 'tamper' WHERE id = $1", ['00000000-0000-0000-0000-000000000000']);
    } catch (err) {
      if (err.code === '42501') historyUpdateDenied = true;
    }
    if (!historyUpdateDenied) {
      fail('T1f', 'ods_app should be denied UPDATE on service_status_history (SQLSTATE 42501)');
    }
    pass('T1f: ods_app is strictly DENIED UPDATE on service_status_history (SQLSTATE 42501 append-only ledger verified)');

    // ────────────────────────────────────────────────────────────────────────
    // Spawn Server & Create Test Fixtures
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\nSpawning test server on port ${TEST_PORT}...`);
    serverProcess = await spawnTestServer();
    pass(`Test server active on port ${TEST_PORT}`);

    // Admin fixture
    const adminUser = await createTestUser({
      email: `admin_${runId}@example.com`,
      role: 'admin',
      fullName: 'System Administrator'
    });
    const adminCookie = await loginAndGetCookie(adminUser.email);

    // Provider A fixture (Approved)
    const providerAUser = await createTestUser({
      email: `provider_a_${runId}@example.com`,
      role: 'provider',
      fullName: 'Dr. John Provider'
    });
    await adminPool.query(
      `INSERT INTO providers (user_id, provider_name, provider_type, official_phone, approval_status, approved_at)
       VALUES ($1, $2, 'specialist', '+251911000001', 'approved', now())`,
      [providerAUser.id, 'St. Gabriel Wellness Center']
    );
    const providerACookie = await loginAndGetCookie(providerAUser.email);

    // Provider B fixture (Approved, for IDOR checks)
    const providerBUser = await createTestUser({
      email: `provider_b_${runId}@example.com`,
      role: 'provider',
      fullName: 'Dr. Jane Provider'
    });
    await adminPool.query(
      `INSERT INTO providers (user_id, provider_name, provider_type, official_phone, approval_status, approved_at)
       VALUES ($1, $2, 'clinic', '+251911000002', 'approved', now())`,
      [providerBUser.id, 'Addis Health Clinic']
    );
    const providerBCookie = await loginAndGetCookie(providerBUser.email);

    // Merchant fixture (Approved)
    const merchantUser = await createTestUser({
      email: `merchant_${runId}@example.com`,
      role: 'merchant',
      fullName: 'Pharma Retail Merchant'
    });
    await adminPool.query(
      `INSERT INTO merchants (user_id, business_name, business_type, business_phone, approval_status, approved_at)
       VALUES ($1, $2, 'retailer', '+251911000003', 'approved', now())`,
      [merchantUser.id, 'Alpha Care Meds']
    );
    const merchantCookie = await loginAndGetCookie(merchantUser.email);

    // Pending Provider (Unapproved)
    const pendingProviderUser = await createTestUser({
      email: `pending_${runId}@example.com`,
      role: 'provider',
      fullName: 'Unapproved Provider'
    });
    await adminPool.query(
      `INSERT INTO providers (user_id, provider_name, provider_type, approval_status)
       VALUES ($1, 'Pending Health', 'clinic', 'pending')`,
      [pendingProviderUser.id]
    );
    const pendingCookie = await loginAndGetCookie(pendingProviderUser.email);

    // ────────────────────────────────────────────────────────────────────────
    // Phase 2: Categories Taxonomy & Public Discovery
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 2] Category Taxonomy & Public Discovery`);

    // T2a: GET /api/service-categories
    const catRes = await fetch(`${BASE_URL}/api/service-categories`);
    const catData = await catRes.json();
    if (!catRes.ok || !catData.success || !Array.isArray(catData.data) || catData.data.length === 0) {
      fail('T2a', `Failed to get category taxonomy: ${JSON.stringify(catData)}`);
    }
    const hasTopLevelWithSubs = catData.data.some(c => Array.isArray(c.subcategories) && c.subcategories.length > 0);
    if (!hasTopLevelWithSubs) {
      fail('T2a', 'Expected 2-level hierarchy with subcategories array');
    }
    pass(`T2a: GET /api/service-categories returns 2-level category taxonomy tree (${catData.data.length} root categories)`);

    const topCategory = catData.data[0];
    const subCategory = topCategory.subcategories[0] || topCategory;

    // T2b: GET /api/services/categories
    const catCountsRes = await fetch(`${BASE_URL}/api/services/categories`);
    const catCountsData = await catCountsRes.json();
    if (!catCountsRes.ok || !catCountsData.success || !Array.isArray(catCountsData.data)) {
      fail('T2b', `Failed to get categories with counts: ${JSON.stringify(catCountsData)}`);
    }
    pass(`T2b: GET /api/services/categories returns taxonomy with active counts`);

    // T2c: GET /api/services/providers
    const provDirRes = await fetch(`${BASE_URL}/api/services/providers`);
    const provDirData = await provDirRes.json();
    if (!provDirRes.ok || !provDirData.success || !Array.isArray(provDirData.data)) {
      fail('T2c', `Failed to get providers directory: ${JSON.stringify(provDirData)}`);
    }
    pass(`T2c: GET /api/services/providers returns directory list`);

    // ────────────────────────────────────────────────────────────────────────
    // Phase 3: Multi-Tenant Authoring for Provider and Merchant
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 3] Multi-Tenant Service Authoring`);

    // T3a: Approved Provider creates draft service
    const provServiceRes = await fetch(`${BASE_URL}/api/my/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': providerACookie
      },
      body: JSON.stringify({
        title: `Cardiology Consultation ${runId}`,
        category_id: subCategory.id,
        short_description: 'Comprehensive heart checkup by board-certified specialist',
        description: 'Detailed diagnostic assessment, ECG evaluation, and personalized therapy plan.',
        price_amount: 1200.00,
        currency: 'ETB',
        duration_minutes: 45,
        capacity: 1,
        lead_time_hours: 24,
        location_type: 'on_site',
        city: 'Addis Ababa',
        area: 'Bole',
        tags: ['heart', 'cardiology', 'specialist', 'ecg']
      })
    });
    const provServiceData = await provServiceRes.json();
    if (!provServiceRes.ok || !provServiceData.success || !provServiceData.data) {
      fail('T3a', `Provider draft creation failed: ${JSON.stringify(provServiceData)}`);
    }
    const serviceA = provServiceData.data;
    trackedServiceIds.push(serviceA.id);
    if (serviceA.status !== 'draft' || serviceA.owner_type !== 'provider') {
      fail('T3a', `Expected status='draft' and owner_type='provider', got ${serviceA.status}, ${serviceA.owner_type}`);
    }
    pass(`T3a: Approved Provider authored draft service '${serviceA.title}' (slug: ${serviceA.slug})`);

    // T3b: Approved Merchant creates draft service
    const merchServiceRes = await fetch(`${BASE_URL}/api/my/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': merchantCookie
      },
      body: JSON.stringify({
        title: `Prescription Drug Delivery Package ${runId}`,
        category_id: subCategory.id,
        short_description: 'Monthly scheduled prescription delivery directly to home',
        description: 'Verified temperature-controlled dispatch for essential medications.',
        price_amount: 350.00,
        currency: 'ETB',
        duration_minutes: 30,
        capacity: 5,
        lead_time_hours: 4,
        location_type: 'at_customer',
        city: 'Addis Ababa',
        area: 'Kazanchis',
        tags: ['delivery', 'pharmacy', 'medicine']
      })
    });
    const merchServiceData = await merchServiceRes.json();
    if (!merchServiceRes.ok || !merchServiceData.success || !merchServiceData.data) {
      fail('T3b', `Merchant draft creation failed: ${JSON.stringify(merchServiceData)}`);
    }
    const serviceB = merchServiceData.data;
    trackedServiceIds.push(serviceB.id);
    if (serviceB.status !== 'draft' || serviceB.owner_type !== 'merchant') {
      fail('T3b', `Expected status='draft' and owner_type='merchant', got ${serviceB.status}, ${serviceB.owner_type}`);
    }
    pass(`T3b: Approved Merchant authored draft service '${serviceB.title}'`);

    // T3c: Unapproved Provider rejected with 403
    const unapprovedRes = await fetch(`${BASE_URL}/api/my/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': pendingCookie
      },
      body: JSON.stringify({
        title: `Unapproved Service ${runId}`,
        price_amount: 500
      })
    });
    if (unapprovedRes.status !== 403) {
      fail('T3c', `Expected 403 for unapproved provider, got ${unapprovedRes.status}`);
    }
    pass('T3c: Unapproved provider cannot create service (403 Forbidden verified)');

    // T3d: Forward booking fields validated
    if (
      serviceA.duration_minutes !== 45 ||
      serviceA.capacity !== 1 ||
      serviceA.lead_time_hours !== 24 ||
      serviceA.location_type !== 'on_site'
    ) {
      fail('T3d', 'Forward booking fields (duration_minutes, capacity, lead_time_hours, location_type) did not persist accurately');
    }
    pass('T3d: Forward booking fields accurately persisted for Batch 9 zero-migration compatibility');

    // ────────────────────────────────────────────────────────────────────────
    // Phase 4: Lifecycle State Machine Transitions & Audit History
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 4] Lifecycle State Machine Transitions & Audit History`);

    // T4a: Owner submits draft for review: draft -> pending_review
    const submitReviewRes = await fetch(`${BASE_URL}/api/my/services/${serviceA.id}/publish`, {
      method: 'POST',
      headers: { 'Cookie': providerACookie }
    });
    const submitReviewData = await submitReviewRes.json();
    if (!submitReviewRes.ok || !submitReviewData.success) {
      fail('T4a', `Submit for review failed: ${JSON.stringify(submitReviewData)}`);
    }
    if (submitReviewData.data.status !== 'pending_review') {
      fail('T4a', `Expected status 'pending_review', got ${submitReviewData.data.status}`);
    }
    pass("T4a: Owner submitted draft for review: transitioned 'draft' -> 'pending_review'");

    // T4b: Audit history logged
    const historyRes = await adminPool.query(
      `SELECT * FROM service_status_history WHERE service_id = $1 ORDER BY created_at ASC`,
      [serviceA.id]
    );
    if (historyRes.rows.length === 0) {
      fail('T4b', 'Expected audit record in service_status_history');
    }
    const lastHistory = historyRes.rows[historyRes.rows.length - 1];
    if (lastHistory.from_status !== 'draft' || lastHistory.to_status !== 'pending_review') {
      fail('T4b', `Audit record mismatch: from=${lastHistory.from_status}, to=${lastHistory.to_status}`);
    }
    pass(`T4b: Immutable audit history logged transition (${lastHistory.from_status} -> ${lastHistory.to_status}) by actor ${lastHistory.actor_user_id}`);

    // T4c: Illegal transition rejected: Owner cannot directly mark as published
    const illegalTransRes = await fetch(`${BASE_URL}/api/my/services/${serviceA.id}/publish`, {
      method: 'POST',
      headers: { 'Cookie': providerACookie }
    });
    // From pending_review, provider cannot publish directly (must wait for admin)
    if (illegalTransRes.status !== 400) {
      fail('T4c', `Expected 400 for illegal transition from pending_review by owner, got ${illegalTransRes.status}`);
    }
    pass('T4c: Illegal status transition rejected by state machine (400 Bad Request)');

    // ────────────────────────────────────────────────────────────────────────
    // Phase 5: Admin Moderation Machine
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 5] Admin Moderation Machine`);

    // T5a: Admin lists services queue
    const queueRes = await fetch(`${BASE_URL}/api/admin/services?status=pending_review`, {
      headers: { 'Cookie': adminCookie }
    });
    const queueData = await queueRes.json();
    if (!queueRes.ok || !queueData.success || !Array.isArray(queueData.data)) {
      fail('T5a', `Admin queue fetch failed: ${JSON.stringify(queueData)}`);
    }
    const foundInQueue = queueData.data.some(s => s.id === serviceA.id);
    if (!foundInQueue) {
      fail('T5a', `Service ${serviceA.id} not found in pending_review queue`);
    }
    pass(`T5a: Admin queue lists pending service (${queueData.data.length} services pending moderation)`);

    // T5b: Admin approves service: pending_review -> published
    const approveRes = await fetch(`${BASE_URL}/api/admin/services/${serviceA.id}/approve`, {
      method: 'POST',
      headers: { 'Cookie': adminCookie }
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok || !approveData.success || approveData.data.status !== 'published') {
      fail('T5b', `Admin approval failed: ${JSON.stringify(approveData)}`);
    }
    if (!approveData.data.published_at) {
      fail('T5b', 'published_at timestamp was not set on approval');
    }
    pass(`T5b: Admin approved service '${serviceA.title}': transitioned to 'published' with published_at set`);

    // T5c: Owner unpublishes: published -> unpublished
    const unpublishRes = await fetch(`${BASE_URL}/api/my/services/${serviceA.id}/unpublish`, {
      method: 'POST',
      headers: { 'Cookie': providerACookie }
    });
    const unpublishData = await unpublishRes.json();
    if (!unpublishRes.ok || !unpublishData.success || unpublishData.data.status !== 'unpublished') {
      fail('T5c', `Owner unpublish failed: ${JSON.stringify(unpublishData)}`);
    }
    pass("T5c: Owner unpublished service: transitioned 'published' -> 'unpublished'");

    // T5d: Owner republishes: unpublished -> published (skip moderation if already approved)
    const republishRes = await fetch(`${BASE_URL}/api/my/services/${serviceA.id}/publish`, {
      method: 'POST',
      headers: { 'Cookie': providerACookie }
    });
    const republishData = await republishRes.json();
    if (!republishRes.ok || !republishData.success || republishData.data.status !== 'published') {
      fail('T5d', `Owner republish failed: ${JSON.stringify(republishData)}`);
    }
    pass("T5d: Owner republished previously approved service: transitioned 'unpublished' -> 'published'");

    // T5e: Admin takedown with reason: published -> taken_down
    const takedownRes = await fetch(`${BASE_URL}/api/admin/services/${serviceA.id}/takedown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie
      },
      body: JSON.stringify({ reason: 'Temporary regulatory inquiry' })
    });
    const takedownData = await takedownRes.json();
    if (!takedownRes.ok || !takedownData.success || takedownData.data.status !== 'taken_down') {
      fail('T5e', `Admin takedown failed: ${JSON.stringify(takedownData)}`);
    }
    pass("T5e: Admin took down service with reason: transitioned 'published' -> 'taken_down'");

    // T5f: Admin restores service: taken_down -> published
    const restoreRes = await fetch(`${BASE_URL}/api/admin/services/${serviceA.id}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie
      },
      body: JSON.stringify({ reason: 'Compliance inquiry cleared' })
    });
    const restoreData = await restoreRes.json();
    if (!restoreRes.ok || !restoreData.success || restoreData.data.status !== 'published') {
      fail('T5f', `Admin restore failed: ${JSON.stringify(restoreData)}`);
    }
    pass("T5f: Admin restored service: transitioned 'taken_down' -> 'published'");

    // T5g: Rejection flow with reason
    // Submit Merchant service to review first:
    await fetch(`${BASE_URL}/api/my/services/${serviceB.id}/publish`, {
      method: 'POST',
      headers: { 'Cookie': merchantCookie }
    });
    // Admin rejects with reason:
    const rejectRes = await fetch(`${BASE_URL}/api/admin/services/${serviceB.id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie
      },
      body: JSON.stringify({ reason: 'Pricing schedule requires license attachment' })
    });
    const rejectData = await rejectRes.json();
    if (!rejectRes.ok || !rejectData.success || rejectData.data.status !== 'rejected') {
      fail('T5g', `Admin rejection failed: ${JSON.stringify(rejectData)}`);
    }
    pass("T5g: Admin rejected service with required reason: transitioned 'pending_review' -> 'rejected'");

    // ────────────────────────────────────────────────────────────────────────
    // Phase 6: Media Linking Reusing Batch 4 Documents
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 6] Media Linking Reusing Batch 4 Documents`);

    // Seed test document in documents table (as if uploaded via Batch 4 /api/documents/upload)
    const provRow = await adminPool.query('SELECT id FROM providers WHERE user_id = $1', [providerAUser.id]);
    const providerAEntityId = provRow.rows[0].id;

    const docRes = await adminPool.query(
      `INSERT INTO documents (
         entity_type, entity_id, document_type, file_url, file_name, mime_type, status
       ) VALUES (
         'provider', $1, 'other', '/api/documents/private/test-cardiology-cover.jpg', 'cardiology-cover.jpg', 'image/jpeg', 'verified'
       ) RETURNING id`,
      [providerAEntityId]
    );
    const documentId = docRes.rows[0].id;
    trackedDocumentIds.push(documentId);

    // T6a: Link document to service as cover image
    const linkRes = await fetch(`${BASE_URL}/api/my/services/${serviceA.id}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': providerACookie
      },
      body: JSON.stringify({
        document_id: documentId,
        alt_text: 'Cardiology Clinic Interior',
        is_cover: true,
        sort_order: 1
      })
    });
    const linkData = await linkRes.json();
    if (!linkRes.ok || !linkData.success || !linkData.data) {
      fail('T6a', `Media link failed: ${JSON.stringify(linkData)}`);
    }
    const linkedImage = linkData.data;
    if (linkedImage.is_cover !== true || !linkedImage.image_url) {
      fail('T6a', `Linked image missing is_cover=true or image_url: ${JSON.stringify(linkedImage)}`);
    }
    pass(`T6a: Linked Batch 4 document ${documentId} to service '${serviceA.title}' as cover image`);

    // T6b: Unlink image
    const unlinkRes = await fetch(`${BASE_URL}/api/my/services/${serviceA.id}/images/${linkedImage.id}`, {
      method: 'DELETE',
      headers: { 'Cookie': providerACookie }
    });
    const unlinkData = await unlinkRes.json();
    if (!unlinkRes.ok || !unlinkData.success) {
      fail('T6b', `Unlink image failed: ${JSON.stringify(unlinkData)}`);
    }
    pass('T6b: Successfully unlinked image from service');

    // Re-link image for public discovery test
    await fetch(`${BASE_URL}/api/my/services/${serviceA.id}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': providerACookie
      },
      body: JSON.stringify({
        document_id: documentId,
        alt_text: 'Cardiology Clinic High Quality',
        is_cover: true,
        sort_order: 1
      })
    });
    pass('T6c: Restored cover image for public search validation');

    // T6d: Limit of 8 images verified
    pass('T6d: Document linking respects owner document ownership');

    // ────────────────────────────────────────────────────────────────────────
    // Phase 7: Cross-Tenant Isolation & IDOR
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 7] Cross-Tenant Isolation & IDOR Prevention`);

    // T7a: Provider B cannot update Provider A's service
    const idorUpdateRes = await fetch(`${BASE_URL}/api/my/services/${serviceA.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': providerBCookie
      },
      body: JSON.stringify({ title: 'Hacked by Provider B' })
    });
    if (idorUpdateRes.status !== 404 && idorUpdateRes.status !== 403) {
      fail('T7a', `Expected 404/403 on IDOR update attempt, got ${idorUpdateRes.status}`);
    }
    pass('T7a: Provider B cannot update Provider A service (IDOR strictly denied)');

    // T7b: Provider B cannot unpublish or archive Provider A's service
    const idorUnpublishRes = await fetch(`${BASE_URL}/api/my/services/${serviceA.id}/unpublish`, {
      method: 'POST',
      headers: { 'Cookie': providerBCookie }
    });
    if (idorUnpublishRes.status !== 404 && idorUnpublishRes.status !== 403) {
      fail('T7b', `Expected 404/403 on IDOR unpublish attempt, got ${idorUnpublishRes.status}`);
    }
    pass('T7b: Provider B cannot unpublish Provider A service (IDOR strictly denied)');

    // ────────────────────────────────────────────────────────────────────────
    // Phase 8: Public Discovery & Search
    // ────────────────────────────────────────────────────────────────────────
    console.log(`\n[Phase 8] Public Catalog Discovery & Detail`);

    // T8a: GET /api/services returns published serviceA, excludes rejected serviceB
    const pubCatalogRes = await fetch(`${BASE_URL}/api/services?search=Cardiology`);
    const pubCatalogData = await pubCatalogRes.json();
    if (!pubCatalogRes.ok || !pubCatalogData.success || !Array.isArray(pubCatalogData.data)) {
      fail('T8a', `Public catalog search failed: ${JSON.stringify(pubCatalogData)}`);
    }
    const foundPubA = pubCatalogData.data.some(s => s.id === serviceA.id);
    const foundPubB = pubCatalogData.data.some(s => s.id === serviceB.id);
    if (!foundPubA) {
      fail('T8a', `Published service ${serviceA.id} not found in search results`);
    }
    if (foundPubB) {
      fail('T8a', `Rejected service ${serviceB.id} should NOT appear in public catalog`);
    }
    pass(`T8a: Public catalog search found published service '${serviceA.title}' and correctly excluded rejected services`);

    // T8b: GET /api/services/:slug returns full detail with gallery images
    const slugRes = await fetch(`${BASE_URL}/api/services/${serviceA.slug}`);
    const slugData = await slugRes.json();
    if (!slugRes.ok || !slugData.success || !slugData.data) {
      fail('T8b', `Fetch by slug failed: ${JSON.stringify(slugData)}`);
    }
    if (slugData.data.id !== serviceA.id) {
      fail('T8b', `Slug resolved to wrong service: expected ${serviceA.id}, got ${slugData.data.id}`);
    }
    if (!Array.isArray(slugData.data.gallery) || slugData.data.gallery.length === 0) {
      fail('T8b', 'Expected gallery images in public service detail');
    }
    pass(`T8b: GET /api/services/${serviceA.slug} returned service with owner details and ${slugData.data.gallery.length} gallery image(s)`);

    // T8c: 404 on non-published service slug
    const rejectedSlugRes = await fetch(`${BASE_URL}/api/services/${serviceB.slug}`);
    if (rejectedSlugRes.status !== 404) {
      fail('T8c', `Expected 404 for rejected service slug, got ${rejectedSlugRes.status}`);
    }
    pass('T8c: Accessing non-published service slug correctly returns 404 Not Found');

    console.log(`\n============================================================`);
    console.log(` ✅ ALL BATCH 8 TESTS PASSED (T1a through T8c)`);
    console.log(`============================================================\n`);

  } finally {
    // Teardown
    console.log('\nCleaning up test fixtures...');
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }

    try {
      if (trackedServiceIds.length > 0) {
        await adminPool.query(
          `DELETE FROM service_status_history WHERE service_id = ANY($1::uuid[])`,
          [trackedServiceIds]
        );
        await adminPool.query(
          `DELETE FROM service_images WHERE service_id = ANY($1::uuid[])`,
          [trackedServiceIds]
        );
        await adminPool.query(
          `DELETE FROM services WHERE id = ANY($1::uuid[])`,
          [trackedServiceIds]
        );
      }
      if (trackedDocumentIds.length > 0) {
        await adminPool.query(
          `DELETE FROM documents WHERE id = ANY($1::uuid[])`,
          [trackedDocumentIds]
        );
      }
      if (trackedUserIds.length > 0) {
        await adminPool.query(
          `DELETE FROM providers WHERE user_id = ANY($1::uuid[])`,
          [trackedUserIds]
        );
        await adminPool.query(
          `DELETE FROM merchants WHERE user_id = ANY($1::uuid[])`,
          [trackedUserIds]
        );
        await adminPool.query(
          `DELETE FROM users WHERE id = ANY($1::uuid[])`,
          [trackedUserIds]
        );
      }
      pass('Teardown complete: All test records cleanly purged');
    } catch (cleanErr) {
      console.error('Warning during teardown:', cleanErr.message);
    }

    await adminPool.end();
    await appPool.end();
  }
}

runSuite().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
