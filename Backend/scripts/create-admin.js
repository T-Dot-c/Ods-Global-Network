/**
 * ODS Global Network — CLI Admin Creation Script
 * Usage:
 *   node scripts/create-admin.js <email> [full_name]
 * Password must be supplied via ADMIN_PASSWORD environment variable or interactive prompt.
 * Passwords are NEVER accepted via process.argv to prevent leakage in process tables.
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
    
    // Simple masked password prompt
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

async function createAdmin() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  const fullName = process.argv[3] || process.env.ADMIN_NAME || 'System Administrator';

  if (!email) {
    console.error('Usage: node scripts/create-admin.js <email> [full_name]');
    console.error('Or set ADMIN_EMAIL in environment.');
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.stdin.isTTY) {
      password = await promptPassword(`Enter admin password for ${email}: `);
    } else {
      console.error('Error: ADMIN_PASSWORD environment variable must be set in non-interactive mode.');
      process.exit(1);
    }
  }

  if (!password || password.length < 8) {
    console.error('Error: Admin password must be at least 8 characters long.');
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
