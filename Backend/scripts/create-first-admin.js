/**
 * ODS Global Network — Controlled Super Admin Provisioning Script
 *
 * Usage:
 *   node scripts/create-first-admin.js <email> <fullName> <password>
 *
 * Enforces strong password, assigns super_admin permission group,
 * generates initial TOTP 2FA secret, and outputs single-use recovery codes.
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../src/db');
const {
  generateSecret,
  generateRecoveryCodes,
  getOtpAuthUri,
} = require('../src/services/twoFactorService');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: node scripts/create-first-admin.js <email> <fullName> <password>');
    process.exit(1);
  }

  const [email, fullName, password] = args;
  const trimmedEmail = email.toLowerCase().trim();

  if (password.length < 12) {
    console.error('[Error] Password must be at least 12 characters for administrator accounts.');
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Check if user already exists
    const checkRes = await client.query('SELECT id FROM users WHERE email = $1', [trimmedEmail]);
    if (checkRes.rows.length > 0) {
      console.error(`[Error] User with email "${trimmedEmail}" already exists.`);
      await client.query('ROLLBACK');
      process.exit(1);
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 3. Insert into users
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active, is_email_verified, token_version)
       VALUES ($1, $2, $3, 'admin', TRUE, TRUE, 1)
       RETURNING id, email, full_name`,
      [trimmedEmail, passwordHash, fullName.trim()]
    );
    const user = userRes.rows[0];

    // 4. Insert into admins
    await client.query(
      `INSERT INTO admins (user_id, role)
       VALUES ($1, 'super_admin')
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );

    // 5. Assign super_admin permission group (Batch 10 RBAC)
    const groupRes = await client.query(
      `SELECT id FROM admin_permission_groups WHERE name = 'super_admin'`
    );
    if (groupRes.rows.length > 0) {
      await client.query(
        `INSERT INTO admin_user_groups (user_id, group_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [user.id, groupRes.rows[0].id]
      );
    }

    // 6. Generate 2FA Secret and Recovery Codes (Batch 12)
    const secret = generateSecret();
    const { plaintextCodes, hashedCodes } = generateRecoveryCodes(8);
    const otpauthUri = getOtpAuthUri(trimmedEmail, secret);

    await client.query(
      `INSERT INTO admin_2fa_secrets (user_id, secret_base32, is_enabled, recovery_hashes)
       VALUES ($1, $2, TRUE, $3)`,
      [user.id, secret, hashedCodes]
    );

    await client.query('COMMIT');

    console.log('\n================================================================');
    console.log('✅ SUPER ADMINISTRATOR PROVISIONED SUCCESSFULLY');
    console.log('================================================================');
    console.log(`User ID:        ${user.id}`);
    console.log(`Email:          ${user.email}`);
    console.log(`Full Name:      ${user.full_name}`);
    console.log(`Role:           admin (super_admin group)`);
    console.log('\n── Two-Factor Authentication (TOTP) Credentials ────────────────');
    console.log(`TOTP Secret:    ${secret}`);
    console.log(`OTPAuth URI:    ${otpauthUri}`);
    console.log('\n── Emergency Single-Use Recovery Codes (STORE SAFELY) ──────────');
    plaintextCodes.forEach((code, idx) => {
      console.log(`  [${idx + 1}] ${code}`);
    });
    console.log('================================================================\n');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Error provisioning super admin]:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
