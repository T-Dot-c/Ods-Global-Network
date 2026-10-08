/**
 * ODS Global Network — CLI Admin Creation Script
 * Usage:
 *   node scripts/create-admin.js <email> <password> <full_name>
 * Or reads from ADMIN_EMAIL and ADMIN_PASSWORD in .env
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../src/db');

async function createAdmin() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  const password = process.argv[3] || process.env.ADMIN_PASSWORD;
  const fullName = process.argv[4] || process.env.ADMIN_NAME || 'System Administrator';

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password> [full_name]');
    console.error('Or set ADMIN_EMAIL and ADMIN_PASSWORD in Backend/.env');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if user already exists
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      console.log(`User ${email} already exists. Updating role to admin and resetting password...`);
      const hash = await bcrypt.hash(password, 12);
      await client.query(
        `UPDATE users SET password_hash = $1, role = 'admin', is_active = TRUE, updated_at = NOW() WHERE email = $2`,
        [hash, email.toLowerCase().trim()]
      );
      // Ensure admin row exists
      await client.query(
        `INSERT INTO admins (user_id, admin_level, permissions)
         VALUES ($1, 'super_admin', '{}'::jsonb)
         ON CONFLICT (user_id) DO NOTHING`,
        [existing.rows[0].id]
      );
    } else {
      const hash = await bcrypt.hash(password, 12);
      const userRes = await client.query(
        `INSERT INTO users (full_name, email, password_hash, role, is_email_verified, is_active)
         VALUES ($1, $2, $3, 'admin', TRUE, TRUE)
         RETURNING id`,
        [fullName.trim(), email.toLowerCase().trim(), hash]
      );
      const newUserId = userRes.rows[0].id;
      await client.query(
        `INSERT INTO admins (user_id, admin_level, permissions)
         VALUES ($1, 'super_admin', '{}'::jsonb)`,
        [newUserId]
      );
    }

    await client.query('COMMIT');
    console.log(`✅ Admin account created/updated successfully: ${email}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to create admin account:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();
