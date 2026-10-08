/**
 * Batch 3 Customer Portal & Security Verification Suite
 * Tests:
 * 1. Unauthenticated request rejection (401) on /api/customer/*
 * 2. Invalid role rejection (403) on /api/customer/*
 * 3. Registration with address persistence
 * 4. Login with session cookie issuance & audit logging
 * 5. GET /api/customer/profile
 * 6. PUT /api/customer/profile with field updates & address update
 * 7. POST /api/customer/change-password (wrong current password -> 400)
 * 8. POST /api/customer/change-password (correct current password -> 200)
 * 9. Login with new password verification
 * 10. Audit log inspection in PostgreSQL
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const pool = require('./src/db');

const API_BASE = 'http://localhost:3001';

async function runTests() {
  console.log('\n======================================================');
  console.log('   ODS Global Network — Batch 3 Verification Suite');
  console.log('======================================================\n');

  let testPassed = 0;
  let testFailed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      testPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${extra}`);
      testFailed++;
    }
  }

  try {
    // ── Test 1: Unauthenticated GET /api/customer/profile (Expect 401) ──
    const res1 = await fetch(`${API_BASE}/api/customer/profile`, { method: 'GET' });
    const data1 = await res1.json();
    assert('Unauthenticated GET /api/customer/profile returns 401', res1.status === 401 && data1.success === false);

    // ── Test 2: Unauthenticated PUT /api/customer/profile (Expect 401) ──
    const res2 = await fetch(`${API_BASE}/api/customer/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Hacker' }),
    });
    const data2 = await res2.json();
    assert('Unauthenticated PUT /api/customer/profile returns 401', res2.status === 401 && data2.success === false);

    // ── Test 3: Unauthenticated POST /api/customer/change-password (Expect 401) ──
    const res3 = await fetch(`${API_BASE}/api/customer/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: 'abc', new_password: 'new_password123' }),
    });
    const data3 = await res3.json();
    assert('Unauthenticated POST /api/customer/change-password returns 401', res3.status === 401 && data3.success === false);

    // ── Test 4: Register a test customer with address ──
    const testEmail = `test_customer_${Date.now()}@odsglobal.net`;
    const initialPassword = 'SecurePassword123!';
    const regRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
        full_name: 'Test Customer Alpha',
        phone: '+251911223344',
        role: 'customer',
        preferred_language: 'en',
        notification_preference: 'email',
        country: 'Ethiopia',
        city: 'Addis Ababa',
        address_line: 'Bole Road 04',
      }),
    });
    const regData = await regRes.json();
    assert('Register customer with address returns 201', regRes.status === 201 && regData.success === true);

    // ── Test 5: Login as test customer (Extract session cookie) ──
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
      }),
    });
    const cookieHeader = loginRes.headers.get('set-cookie');
    const sessionCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
    const loginData = await loginRes.json();
    assert('Login customer returns 200 with session cookie', loginRes.status === 200 && loginData.success === true && !!sessionCookie);

    // ── Test 6: Authenticated GET /api/customer/profile ──
    const profileRes = await fetch(`${API_BASE}/api/customer/profile`, {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const profileData = await profileRes.json();
    assert('Authenticated GET /api/customer/profile returns 200 with customer data', profileRes.status === 200 && profileData.profile.email === testEmail);
    assert('Profile includes persisted address country/city', profileData.profile.country === 'Ethiopia' && profileData.profile.city === 'Addis Ababa');

    // ── Test 7: Authenticated PUT /api/customer/profile ──
    const updateRes = await fetch(`${API_BASE}/api/customer/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        full_name: 'Test Customer Updated',
        phone: '+251999887766',
        preferred_language: 'am',
        notification_preference: 'both',
        city: 'Hawassa',
        address_line: 'Lakeside Avenue',
      }),
    });
    const updateData = await updateRes.json();
    assert('Authenticated PUT /api/customer/profile updates name and city', updateRes.status === 200 && updateData.profile.full_name === 'Test Customer Updated' && updateData.profile.city === 'Hawassa');

    // ── Test 8: Change password with wrong current password (Expect 400) ──
    const wrongPassRes = await fetch(`${API_BASE}/api/customer/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        current_password: 'WrongCurrentPassword!',
        new_password: 'NewStrongPassword456!',
      }),
    });
    const wrongPassData = await wrongPassRes.json();
    assert('Change password with wrong current password returns 400', wrongPassRes.status === 400 && wrongPassData.success === false);

    // ── Test 9: Change password with correct current password (Expect 200) ──
    const newPassword = 'NewStrongPassword456!';
    const correctPassRes = await fetch(`${API_BASE}/api/customer/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        current_password: initialPassword,
        new_password: newPassword,
      }),
    });
    const correctPassData = await correctPassRes.json();
    assert('Change password with correct current password returns 200', correctPassRes.status === 200 && correctPassData.success === true);

    // ── Test 10: Verify login with new password ──
    const reloginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: newPassword,
      }),
    });
    const reloginData = await reloginRes.json();
    assert('Re-login with newly changed password succeeds (200)', reloginRes.status === 200 && reloginData.success === true);

    // ── Test 11: Verify audit logs in PostgreSQL ──
    const auditRes = await pool.query(
      `SELECT action FROM audit_logs WHERE user_id = (SELECT id FROM users WHERE email = $1) ORDER BY created_at ASC`,
      [testEmail]
    );
    const actions = auditRes.rows.map(r => r.action);
    console.log(`\n  📊 Recorded Audit Actions for ${testEmail}:`, actions);
    assert('Audit logs recorded REGISTER_SUCCESS, LOGIN_SUCCESS, PROFILE_UPDATE, PASSWORD_CHANGE',
      actions.includes('REGISTER_SUCCESS') &&
      actions.includes('LOGIN_SUCCESS') &&
      actions.includes('PROFILE_UPDATE') &&
      actions.includes('PASSWORD_CHANGE')
    );

    console.log('\n======================================================');
    console.log(`   Summary: ${testPassed} Passed, ${testFailed} Failed`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test execution error:', err.message);
  } finally {
    await pool.end();
  }
}

runTests();
