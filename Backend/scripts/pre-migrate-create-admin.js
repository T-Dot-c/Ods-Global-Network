/**
 * ODS Global Network — Pre-Migration Admin Provisioning Script
 *
 * Designed to be executed in fresh or staging environments BEFORE running
 * migration 012 (which purges the default seeded admin account).
 *
 * Usage:
 *   node scripts/pre-migrate-create-admin.js <email> [full_name]
 *
 * Security Requirements:
 * - Passwords are NEVER accepted via process.argv to prevent leakage in process tables.
 * - Password must be supplied via ADMIN_PASSWORD environment variable or interactive masked prompt.
 * - Passwords are NEVER printed to stdout or stderr.
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const readline = require('readline');
const bcrypt = require('bcryptjs');
const pool = require('../src/db');

function promptPassword(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    process.stdout.write(query);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    let password = '';
    const onData = (char) => {
      const charStr = char.toString('utf8');
      if (charStr === '\n' || charStr === '\r' || charStr === '\u0004') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        rl.close();
        resolve(password);
      } else if (charStr === '\u0003') { // Ctrl+C
        process.stdin.setRawMode(false);
        process.exit(1);
      } else if (charStr === '\b' || charStr === '\x7f') { // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        password += charStr;
        process.stdout.write('*');
      }
    };

    process.stdin.on('data', onData);
  });
}

async function run() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  const fullName = process.argv[3] || process.env.ADMIN_NAME || 'Platform Administrator';

  if (!email) {
    console.error('Usage: node scripts/pre-migrate-create-admin.js <email> [full_name]');
    console.error('Password must be provided via ADMIN_PASSWORD environment variable or interactive prompt.');
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Invalid email address format.');
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await promptPassword('Enter Administrator Password: ');
  }

  if (!password || password.length < 8 || password.length > 128) {
    console.error('❌ Password must be between 8 and 128 characters.');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Hash password with work factor 12
    const passwordHash = await bcrypt.hash(password, 12);

    // 2. Insert or update user
    const userRes = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    let userId;
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      await client.query(
        `UPDATE users
         SET password_hash = $1,
             full_name = $2,
             role = 'admin',
             is_active = TRUE,
             failed_login_attempts = 0,
             locked_until = NULL,
             updated_at = NOW()
         WHERE id = $3`,
        [passwordHash, fullName.trim(), userId]
      );
    } else {
      const insertUserRes = await client.query(
        `INSERT INTO users (email, password_hash, full_name, role, is_active)
         VALUES ($1, $2, $3, 'admin', TRUE)
         RETURNING id`,
        [email.toLowerCase().trim(), passwordHash, fullName.trim()]
      );
      userId = insertUserRes.rows[0].id;
    }

    // 3. Ensure admins table profile exists with super_admin role
    const adminRes = await client.query(
      `SELECT id FROM admins WHERE user_id = $1`,
      [userId]
    );

    if (adminRes.rows.length === 0) {
      await client.query(
        `INSERT INTO admins (user_id, role, permissions)
         VALUES ($1, 'super_admin', '{"all": true}'::jsonb)`,
        [userId]
      );
    } else {
      await client.query(
        `UPDATE admins
         SET role = 'super_admin',
             permissions = '{"all": true}'::jsonb
         WHERE user_id = $1`,
        [userId]
      );
    }

    await client.query('COMMIT');
    console.log(`✅ Administrator provisioned successfully before migration 012: ${email.toLowerCase().trim()}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to provision administrator:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
