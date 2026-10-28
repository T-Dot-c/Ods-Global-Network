/**
 * ODS Global Network — Purge Test and Dummy Accounts Script
 *
 * Removes development test users and seeded dummy admins from the database
 * prior to production go-live, while strictly preserving reference taxonomy.
 *
 * Usage:
 *   node scripts/purge-test-and-seed-data.js [--execute]
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/db');

async function main() {
  const isExecute = process.argv.includes('--execute');

  console.log('\n================================================================');
  console.log(`🧹 TEST ACCOUNT PURGE AUDIT (${isExecute ? 'EXECUTION MODE' : 'DRY RUN'})`);
  console.log('================================================================');

  const client = await pool.connect();
  try {
    // 1. Identify test users matching test patterns or legacy dev seeds
    const identifyQuery = `
      SELECT id, email, role, created_at
      FROM users
      WHERE email LIKE 'b4_test_%'
         OR email LIKE 'b4_super_%'
         OR email LIKE 'b4_staff_%'
         OR email LIKE 'super_b10_%'
         OR email LIKE 'support_b10_%'
         OR email LIKE 'test_%'
         OR email LIKE '%@example.com'
         OR email = 'admin@odsglobal.net'
      ORDER BY role, email;
    `;

    const res = await client.query(identifyQuery);
    console.log(`Identified ${res.rows.length} test/dummy account(s):`);
    console.table(res.rows);

    if (res.rows.length === 0) {
      console.log('✅ No dummy or test accounts found in database.');
      return;
    }

    if (!isExecute) {
      console.log('\n⚠️  DRY RUN ONLY. Pass "--execute" to permanently purge these accounts.\n');
      return;
    }

    await client.query('BEGIN');
    const userIds = res.rows.map(r => r.id);

    // Delete cascading references
    await client.query('DELETE FROM admin_2fa_secrets WHERE user_id = ANY($1)', [userIds]);
    await client.query('DELETE FROM admin_user_groups WHERE user_id = ANY($1)', [userIds]);
    await client.query('DELETE FROM admin_user_permissions WHERE user_id = ANY($1)', [userIds]);
    await client.query('DELETE FROM admins WHERE user_id = ANY($1)', [userIds]);
    await client.query('DELETE FROM merchants WHERE user_id = ANY($1)', [userIds]);
    await client.query('DELETE FROM providers WHERE user_id = ANY($1)', [userIds]);
    await client.query('DELETE FROM users WHERE id = ANY($1)', [userIds]);

    await client.query('COMMIT');
    console.log(`\n✅ Successfully purged ${userIds.length} test accounts from database.\n`);

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Error purging test accounts]:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
