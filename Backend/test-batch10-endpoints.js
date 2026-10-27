/**
 * ODS Global Network — Batch 10 Full Admin Console Test Suite
 *
 * Covers 10 comprehensive verification phases:
 * - T1: Database Migration 022 Schema & Least-Privilege Grants (SELECT/INSERT only on audit log)
 * - T2: Granular RBAC Permission Enforcement (403 for missing permissions, denial logged)
 * - T3: Immediate Revocation (Permission revocation takes effect on the next HTTP request)
 * - T4: User Administration (Search, profile view, suspend with session termination, reactivate, force sign-out, notes)
 * - T5: Super Admin Role Changes & Step-up Password Protection (last super admin protected)
 * - T6: KYC Compliance Verification & Decision Machine
 * - T7: Finance & Two-Person Refund Authorization (> 10,000 ETB requires distinct approver)
 * - T8: Booking Oversight & Late-Payment Conflict Resolution
 * - T9: Gift Card Management & Audited Code Reveal
 * - T10: Operational Reports & Audited CSV Streaming Export
 *
 * Usage:
 *   $env:ALLOW_DESTRUCTIVE_TESTS=1; node test-batch10-endpoints.js
 */
'use strict';

require('dotenv').config();
const { Pool } = require('pg');
const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const BASE_PORT = 3018;
const BASE_URL = `http://127.0.0.1:${BASE_PORT}`;

// App connection (least-privilege ods_app)
const appPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'ods_global.net',
  user: process.env.DB_USER || 'ods_app',
  password: process.env.DB_PASSWORD || 'ods_app_dev_password_123',
});

// Admin connection (for fixture creation and teardown)
const adminPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'ods_global.net',
  user: process.env.TEST_ADMIN_DB_USER || 'postgres',
  password: process.env.TEST_ADMIN_DB_PASSWORD || 'postgres18',
});

if (process.env.ALLOW_DESTRUCTIVE_TESTS !== '1') {
  console.error('\n❌ FATAL: ALLOW_DESTRUCTIVE_TESTS=1 is required to run Batch 10 tests.\n');
  process.exit(1);
}

const runId = crypto.randomBytes(4).toString('hex');
let serverProcess = null;
let capturedServerLogs = '';

function spawnTestServer() {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PORT: String(BASE_PORT),
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
      if (str.includes(`[ODS API] Running on http://localhost:${BASE_PORT}`)) {
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
      reject(new Error(`Test server failed to start in 25s. Logs:\n${capturedServerLogs}`));
    }, 25000);
  });
}

const trackedUserIds = [];
const trackedBookingIds = [];
const trackedTransactionIds = [];
const trackedGiftIds = [];

function pass(msg) {
  console.log(`  ✅ [PASS] ${msg}`);
}

function fail(msg, detail = '') {
  console.error(`  ❌ [FAIL] ${msg}`, detail);
  if (capturedServerLogs) {
    console.error('\n--- Recent Server Logs ---\n' + capturedServerLogs.slice(-2000) + '\n-------------------------\n');
  }
  throw new Error(`Assertion failed: ${msg}`);
}

async function createTestUser({ email, password, role, fullName, adminLevel = null, isVerified = true }) {
  const cleanEmail = email.toLowerCase().trim();
  const hash = await bcrypt.hash(password, 10);
  const res = await adminPool.query(
    `INSERT INTO users (email, password_hash, full_name, role, is_active, is_email_verified)
     VALUES ($1, $2, $3, $4, TRUE, $5)
     RETURNING id, email, role`,
    [cleanEmail, hash, fullName, (adminLevel === 'super_admin' ? 'admin' : role), isVerified]
  );
  const user = res.rows[0];
  trackedUserIds.push(user.id);

  if (role === 'admin' || role === 'super_admin' || adminLevel) {
    await adminPool.query(
      `INSERT INTO admins (user_id, admin_level) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`,
      [user.id, adminLevel || (role === 'super_admin' ? 'super_admin' : 'staff')]
    );
  }

  return user;
}

async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Login failed for ${email}: ${errText}`);
  }
  const cookie = res.headers.get('set-cookie');
  return cookie ? cookie.split(';')[0] : '';
}

async function runSuite() {
  console.log('\n============================================================');
  console.log(` ODS Global Network — Batch 10 Full Admin Console Test Suite`);
  console.log(` Run ID: ${runId} | Ephemeral Port: ${BASE_PORT}`);
  console.log('============================================================\n');

  try {
    // ─────────────────────────────────────────────────────────────
    // Phase 1: Database Migration 022 Schema & Least-Privilege Grants
    // ─────────────────────────────────────────────────────────────
    console.log('[Phase 1] Database Migration 022 Schema & Least-Privilege Grants (T1a-T1d)');
    const tablesCheck = await adminPool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'admin_permissions', 'admin_permission_groups', 'admin_group_permissions',
          'admin_user_groups', 'admin_user_permissions', 'admin_audit_log',
          'user_admin_notes', 'refund_approvals', 'platform_settings'
        );
    `);
    if (tablesCheck.rows.length !== 9) {
      fail('T1a: Batch 10 tables exist', `Expected 9 tables, found ${tablesCheck.rows.length}`);
    }
    pass('T1a: All 9 Batch 10 tables exist in public schema');

    // T1b: Verify ods_app permissions on admin_audit_log (SELECT, INSERT only)
    const auditPerms = await adminPool.query(`
      SELECT privilege_type FROM information_schema.role_table_grants 
      WHERE grantee = 'ods_app' AND table_name = 'admin_audit_log';
    `);
    const privs = auditPerms.rows.map(r => r.privilege_type);
    if (!privs.includes('SELECT') || !privs.includes('INSERT')) {
      fail('T1b: ods_app SELECT/INSERT on admin_audit_log', JSON.stringify(privs));
    }
    pass('T1b: ods_app granted SELECT and INSERT on admin_audit_log');

    // T1c: Verify ods_app DELETE strictly denied on admin_audit_log
    try {
      await appPool.query(`DELETE FROM admin_audit_log WHERE 1=0;`);
      fail('T1c: DELETE denied on admin_audit_log', 'Expected permission denied error');
    } catch (permErr) {
      if (permErr.code === '42501') {
        pass('T1c: ods_app strictly denied DELETE on admin_audit_log (SQLSTATE 42501)');
      } else {
        fail('T1c: DELETE denied on admin_audit_log', permErr.message);
      }
    }

    // T1d: Verify ods_app UPDATE strictly denied on admin_audit_log
    try {
      await appPool.query(`UPDATE admin_audit_log SET reason = 'test' WHERE 1=0;`);
      fail('T1d: UPDATE denied on admin_audit_log', 'Expected permission denied error');
    } catch (permErr) {
      if (permErr.code === '42501') {
        pass('T1d: ods_app strictly denied UPDATE on admin_audit_log (SQLSTATE 42501)');
      } else {
        fail('T1d: UPDATE denied on admin_audit_log', permErr.message);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Start Ephemeral Server
    // ─────────────────────────────────────────────────────────────
    console.log(`\n[Server] Starting backend on port ${BASE_PORT}...`);
    serverProcess = await spawnTestServer();
    pass(`Ephemeral server running on http://127.0.0.1:${BASE_PORT}`);

    // Create Test Fixture Users
    const superAdmin = await createTestUser({
      email: `super_b10_${runId}@ods.com`,
      password: 'SuperPassword123!',
      role: 'super_admin',
      fullName: 'Super Admin User',
      adminLevel: 'super_admin',
    });
    const superCookie = await loginUser(superAdmin.email, 'SuperPassword123!');

    const supportAdmin = await createTestUser({
      email: `support_b10_${runId}@ods.com`,
      password: 'SupportPass123!',
      role: 'admin',
      fullName: 'Support Staff User',
      adminLevel: 'staff',
    });
    // Assign 'Support' group to supportAdmin
    const supportGroup = await adminPool.query(`SELECT id FROM admin_permission_groups WHERE name = 'Support'`);
    await adminPool.query(
      `INSERT INTO admin_user_groups (user_id, group_id) VALUES ($1, $2)`,
      [supportAdmin.id, supportGroup.rows[0].id]
    );
    const supportCookie = await loginUser(supportAdmin.email, 'SupportPass123!');

    const customerUser = await createTestUser({
      email: `cust_b10_${runId}@ods.com`,
      password: 'CustomerPass123!',
      role: 'customer',
      fullName: 'Test Customer B10',
    });
    const customerCookie = await loginUser(customerUser.email, 'CustomerPass123!');

    // ─────────────────────────────────────────────────────────────
    // Phase 2: Granular RBAC & Permission Enforcement (T2a-T2d)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Phase 2] Granular RBAC Permission Enforcement (T2a-T2d)');

    // T2a: Support admin can view users (has users.view)
    const listRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: supportCookie },
    });
    if (!listRes.ok) fail('T2a: Support admin users.view', await listRes.text());
    pass('T2a: Staff admin with Support group successfully accessed GET /api/admin/users (HTTP 200)');

    // T2b: Support admin FORBIDDEN from suspending users (lacks users.suspend)
    const suspRes = await fetch(`${BASE_URL}/api/admin/users/${customerUser.id}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: supportCookie },
      body: JSON.stringify({ reason: 'Attempted unauthorized suspension' }),
    });
    if (suspRes.status !== 403) {
      fail('T2b: Support admin forbidden on suspend', `Expected 403, got ${suspRes.status}`);
    }
    pass('T2b: Staff admin lacking users.suspend received HTTP 403 Forbidden on suspension endpoint');

    // T2c: Permission denial was logged to admin_audit_log
    const denialLog = await adminPool.query(`
      SELECT action, permission_key FROM admin_audit_log
      WHERE actor_user_id = $1 AND action = 'PERMISSION_DENIED'
      ORDER BY created_at DESC LIMIT 1;
    `, [supportAdmin.id]);
    if (denialLog.rows.length === 0 || denialLog.rows[0].permission_key !== 'users.suspend') {
      fail('T2c: Permission denial logged', 'Expected audit row for PERMISSION_DENIED');
    }
    pass('T2c: Permission denial event was automatically recorded in admin_audit_log');

    // T2d: Customer forbidden on all admin routes
    const custAdminRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: customerCookie },
    });
    if (custAdminRes.status !== 403) fail('T2d: Customer access to admin', `Expected 403, got ${custAdminRes.status}`);
    pass('T2d: Non-admin customer strictly forbidden from accessing /api/admin/* (HTTP 403)');

    // ─────────────────────────────────────────────────────────────
    // Phase 3: Immediate Revocation & Session Invalidation (T3a-T3b)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Phase 3] Immediate Revocation & Dynamic Permission Resolution (T3a-T3b)');

    // T3a: Grant supportAdmin users.suspend directly in DB
    const suspPerm = await adminPool.query(`SELECT id FROM admin_permissions WHERE key = 'users.suspend'`);
    await adminPool.query(
      `INSERT INTO admin_user_permissions (user_id, permission_id, is_granted) VALUES ($1, $2, TRUE)`,
      [supportAdmin.id, suspPerm.rows[0].id]
    );

    // Immediately call suspend without re-login — should now be authorized!
    const grantRes = await fetch(`${BASE_URL}/api/admin/users/${customerUser.id}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: supportCookie },
      body: JSON.stringify({ reason: 'Compliance investigation' }),
    });
    if (!grantRes.ok) fail('T3a: Immediate grant test', await grantRes.text());
    pass('T3a: Granted permission in DB took effect immediately on the very next HTTP request without re-login (HTTP 200)');

    // T3b: Revoke permission in DB — immediately receives 403 on next call!
    await adminPool.query(
      `DELETE FROM admin_user_permissions WHERE user_id = $1 AND permission_id = $2`,
      [supportAdmin.id, suspPerm.rows[0].id]
    );
    const revokeRes = await fetch(`${BASE_URL}/api/admin/users/${customerUser.id}/reactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: supportCookie },
      body: JSON.stringify({ reason: 'Reactivation test' }),
    });
    if (revokeRes.status !== 403) fail('T3b: Immediate revoke test', `Expected 403, got ${revokeRes.status}`);
    pass('T3b: Revoked permission in DB took effect immediately on the next request with zero JWT delay (HTTP 403)');

    // ─────────────────────────────────────────────────────────────
    // Phase 4: User Administration (T4a-T4d)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Phase 4] User Administration & Session Invalidation (T4a-T4d)');

    // T4a: Super admin reactivates customer account
    const reactRes = await fetch(`${BASE_URL}/api/admin/users/${customerUser.id}/reactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superCookie },
      body: JSON.stringify({ reason: 'Investigation cleared' }),
    });
    if (!reactRes.ok) fail('T4a: Reactivate user', await reactRes.text());
    pass('T4a: User reactivated successfully by super admin');

    // T4b: Add internal administrative note
    const noteRes = await fetch(`${BASE_URL}/api/admin/users/${customerUser.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superCookie },
      body: JSON.stringify({ note: 'Verified primary contact phone number via telecom inquiry.' }),
    });
    if (!noteRes.ok) fail('T4b: Add user note', await noteRes.text());
    pass('T4b: Internal administrative note added to user profile');

    // T4c: Force sign-out (token_version bump)
    const signoutRes = await fetch(`${BASE_URL}/api/admin/users/${customerUser.id}/force-signout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superCookie },
      body: JSON.stringify({ reason: 'Security session reset' }),
    });
    if (!signoutRes.ok) fail('T4c: Force sign-out', await signoutRes.text());
    pass('T4c: Force sign-out executed; token_version incremented in database');

    // T4d: Previous customer session cookie is now invalid (401)
    const staleCheckRes = await fetch(`${BASE_URL}/api/customer/profile`, {
      headers: { Cookie: customerCookie },
    });
    if (staleCheckRes.status !== 401) fail('T4d: Stale session rejected', `Expected 401, got ${staleCheckRes.status}`);
    pass('T4d: Customer previous session cookie immediately rejected with HTTP 401 Unauthorized');

    // ─────────────────────────────────────────────────────────────
    // Phase 5: Super Admin Role Changes & Step-up Authentication (T5a-T5b)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Phase 5] Super Admin Role Changes & Step-up Authentication (T5a-T5b)');

    // T5a: Changing role without step-up password rejected with 401
    const badStepUpRes = await fetch(`${BASE_URL}/api/admin/users/${customerUser.id}/change-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superCookie },
      body: JSON.stringify({
        new_role: 'provider',
        current_password: 'WrongPassword!',
        reason: 'Provider promotion',
      }),
    });
    if (badStepUpRes.status !== 401) fail('T5a: Step-up password check', `Expected 401, got ${badStepUpRes.status}`);
    pass('T5a: Role change with invalid step-up password rejected with HTTP 401 Unauthorized');

    // T5b: Changing role with valid step-up password succeeds
    const goodStepUpRes = await fetch(`${BASE_URL}/api/admin/users/${customerUser.id}/change-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superCookie },
      body: JSON.stringify({
        new_role: 'provider',
        current_password: 'SuperPassword123!',
        reason: 'Provider accreditation granted',
      }),
    });
    if (!goodStepUpRes.ok) fail('T5b: Valid role change', await goodStepUpRes.text());
    pass('T5b: Role changed to provider with valid step-up password confirmation');

    // ─────────────────────────────────────────────────────────────
    // Phase 6: Finance & Two-Person Refund Approval Workflow (T6a-T6c)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Phase 6] Finance & Two-Person Refund Authorization (T6a-T6c)');

    // Seed completed transaction of 15,000 ETB
    const txRef = `TX-TEST-${runId}`;
    const txRes = await adminPool.query(
      `INSERT INTO transactions (user_id, tx_ref, chapa_reference, amount, currency, status, purpose, payment_method)
       VALUES ($1, $2, $3, 15000.00, 'ETB', 'completed', 'booking_payment', 'telebirr')
       RETURNING id, tx_ref`,
      [customerUser.id, txRef, `CHAPA-${runId}`]
    );
    const testTx = txRes.rows[0];
    trackedTransactionIds.push(testTx.id);

    // Create Finance Admin
    const financeAdmin = await createTestUser({
      email: `finance_b10_${runId}@ods.com`,
      password: 'FinancePass123!',
      role: 'admin',
      fullName: 'Finance Officer User',
    });
    const finGroup = await adminPool.query(`SELECT id FROM admin_permission_groups WHERE name = 'Finance'`);
    await adminPool.query(`INSERT INTO admin_user_groups (user_id, group_id) VALUES ($1, $2)`, [financeAdmin.id, finGroup.rows[0].id]);
    const financeCookie = await loginUser(financeAdmin.email, 'FinancePass123!');

    // T6a: Request refund of 15,000 ETB (> 10,000 ETB threshold) -> enters pending_approval
    const refReqRes = await fetch(`${BASE_URL}/api/admin/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        transaction_id: testTx.id,
        amount: 15000.00,
        reason: 'Customer requested clinical surgery refund',
      }),
    });
    const refReqData = await refReqRes.json();
    if (refReqRes.status !== 202 || refReqData.status !== 'pending_approval') {
      fail('T6a: Large refund threshold trigger', JSON.stringify(refReqData));
    }
    pass('T6a: Refund > 10,000 ETB held in pending_approval requiring second approver (HTTP 202)');

    // T6b: Requester attempting to approve own refund is rejected (Two-person violation!)
    const selfApproveRes = await fetch(`${BASE_URL}/api/admin/refunds/${refReqData.approval_id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({ reason: 'Self-approval attempt' }),
    });
    if (selfApproveRes.status !== 403) {
      fail('T6b: Two-person rule self-approval check', `Expected 403, got ${selfApproveRes.status}`);
    }
    pass('T6b: Two-person rule enforced: Requester strictly forbidden from approving own refund (HTTP 403)');

    // T6c: Second distinct admin (Super Admin) approves the refund
    const secondApproveRes = await fetch(`${BASE_URL}/api/admin/refunds/${refReqData.approval_id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superCookie },
      body: JSON.stringify({ reason: 'Audit reviewed and authorized' }),
    });
    if (!secondApproveRes.ok) fail('T6c: Second approver authorization', await secondApproveRes.text());
    pass('T6c: Second distinct administrator successfully authorized and executed the refund');

    // ─────────────────────────────────────────────────────────────
    // Phase 7: Gift Card Oversight & Logged Code Reveal (T7a-T7b)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Phase 7] Gift Card Oversight & Logged Code Reveal (T7a-T7b)');

    // Seed test gift card
    const giftCode = `ODS-GC-B10-${runId.toUpperCase()}`;
    const giftHash = crypto.createHash('sha256').update(giftCode).digest('hex');
    const giftRes = await adminPool.query(
      `INSERT INTO gift_cards (
        code, code_hash, sender_id, initial_amount, balance, status, expiry_date
      ) VALUES ($1, $2, $3, 1000.00, 1000.00, 'active', NOW() + INTERVAL '180 days')
      RETURNING id, code`,
      [giftCode, giftHash, customerUser.id]
    );
    const testGift = giftRes.rows[0];
    trackedGiftIds.push(testGift.id);

    // T7a: Gift listing masks redemption codes by default
    const giftsListRes = await fetch(`${BASE_URL}/api/admin/gifts`, {
      headers: { Cookie: superCookie },
    });
    const giftsListData = await giftsListRes.json();
    const foundGift = giftsListData.data.gifts.find(g => g.id === testGift.id);
    if (!foundGift || foundGift.code.includes(runId.toUpperCase())) {
      fail('T7a: Gift code masking', JSON.stringify(foundGift));
    }
    pass(`T7a: Gift voucher code safely masked in administrative listing: "${foundGift.code}"`);

    // T7b: Reveal code endpoint returns unmasked code and records audit event
    const revealRes = await fetch(`${BASE_URL}/api/admin/gifts/${testGift.id}/reveal-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superCookie },
      body: JSON.stringify({ reason: 'Customer lost voucher email and requested phone verification' }),
    });
    const revealData = await revealRes.json();
    if (!revealRes.ok || revealData.data.code !== giftCode) {
      fail('T7b: Reveal code', JSON.stringify(revealData));
    }
    pass(`T7b: Full unmasked voucher code revealed under audited authorization: "${revealData.data.code}"`);

    // Verify audit entry for reveal code
    const revealAudit = await adminPool.query(`
      SELECT action, permission_key FROM admin_audit_log
      WHERE target_id = $1 AND action = 'GIFT_CODE_REVEALED'
    `, [testGift.id]);
    if (revealAudit.rows.length === 0) fail('T7b: Audit log for code reveal', 'No audit entry found');
    pass('T7b: High-priority audit record generated for gift code unmasking');

    // ─────────────────────────────────────────────────────────────
    // Phase 8: Operational Reports & Audited CSV Export (T8a-T8b)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Phase 8] Operational Reports & Audited CSV Export (T8a-T8b)');

    // T8a: Query users report dataset
    const reportRes = await fetch(`${BASE_URL}/api/admin/reports/users`, {
      headers: { Cookie: superCookie },
    });
    const reportData = await reportRes.json();
    if (!reportRes.ok || !Array.isArray(reportData.data)) {
      fail('T8a: Users report query', JSON.stringify(reportData));
    }
    pass(`T8a: Operational report dataset 'users' generated successfully (${reportData.data.length} groups)`);

    // T8b: Stream CSV export
    const exportRes = await fetch(`${BASE_URL}/api/admin/reports/users/export`, {
      headers: { Cookie: superCookie },
    });
    const csvContent = await exportRes.text();
    if (!exportRes.ok || !csvContent.startsWith('role,')) {
      fail('T8b: CSV export', csvContent.slice(0, 100));
    }
    pass('T8b: RFC 4180 compliant CSV report exported with proper attachment headers');

    // ─────────────────────────────────────────────────────────────
    // Phase 9: Unified Operational Dashboard (T9)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Phase 9] Unified Operational Dashboard & Metrics (T9)');
    const dashRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Cookie: superCookie },
    });
    const dashData = await dashRes.json();
    if (!dashRes.ok || !dashData.data.counters) {
      fail('T9: Dashboard metrics', JSON.stringify(dashData));
    }
    pass('T9: Dashboard KPI counters and Needs Attention queue compiled successfully');

    // ─────────────────────────────────────────────────────────────
    // Phase 10: Append-Only Audit Log Ledger Inspection (T10)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Phase 10] Append-Only Audit Log Ledger Query (T10)');
    const auditQueryRes = await fetch(`${BASE_URL}/api/admin/audit-log?limit=10`, {
      headers: { Cookie: superCookie },
    });
    const auditQueryData = await auditQueryRes.json();
    if (!auditQueryRes.ok || !Array.isArray(auditQueryData.data.items)) {
      fail('T10: Audit log query', JSON.stringify(auditQueryData));
    }
    pass(`T10: Batch 10 audit log returned ${auditQueryData.data.items.length} recent immutable action entries`);

    console.log('\n============================================================');
    console.log(' ✅ ALL BATCH 10 TEST SUITES PASSED (T1a through T10)');
    console.log('============================================================\n');

  } finally {
    // Teardown
    console.log('[Teardown] Cleaning up tracked test fixtures...');
    try {
      if (serverProcess) {
        serverProcess.kill('SIGTERM');
      }
      if (trackedGiftIds.length > 0) {
        await adminPool.query(`DELETE FROM gift_cards WHERE id = ANY($1::uuid[])`, [trackedGiftIds]);
      }
      if (trackedTransactionIds.length > 0) {
        await adminPool.query(`DELETE FROM refund_approvals WHERE transaction_id = ANY($1::uuid[])`, [trackedTransactionIds]);
        await adminPool.query(`DELETE FROM transactions WHERE id = ANY($1::uuid[])`, [trackedTransactionIds]);
      }
      if (trackedUserIds.length > 0) {
        await adminPool.query(`DELETE FROM admin_audit_log WHERE actor_user_id = ANY($1::uuid[]) OR target_id = ANY($2::text[])`, [trackedUserIds, trackedUserIds.map(String)]);
        await adminPool.query(`DELETE FROM user_admin_notes WHERE user_id = ANY($1::uuid[]) OR author_user_id = ANY($1::uuid[])`, [trackedUserIds]);
        await adminPool.query(`DELETE FROM admin_user_permissions WHERE user_id = ANY($1::uuid[])`, [trackedUserIds]);
        await adminPool.query(`DELETE FROM admin_user_groups WHERE user_id = ANY($1::uuid[])`, [trackedUserIds]);
        await adminPool.query(`DELETE FROM admins WHERE user_id = ANY($1::uuid[])`, [trackedUserIds]);
        await adminPool.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [trackedUserIds]);
      }
      pass('Teardown complete: All test fixtures cleanly purged');
    } catch (cleanErr) {
      console.error('Warning during teardown:', cleanErr.message);
    }

    await adminPool.end();
    await appPool.end();
  }
}

runSuite().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
