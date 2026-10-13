/**
 * ODS Global Network — Restore Dev Accounts
 *
 * Restores the standard dev testing accounts with known dev passwords and 'approved' status:
 *   1. merchant01@ods.com       (Merchant 01 Retail)
 *   2. merchant@123.com         (Merchant 123 Ltd)
 *   3. serviceprovider@123.com  (Care Diagnostics)
 *
 * NOTE: This script is strictly UPDATE-ONLY. It never executes INSERT on users.
 * Requires DEV_PASSWORD environment variable (no fallback).
 */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function restore() {
  const adminPool = new Pool({
    host: process.env.TEST_ADMIN_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_ADMIN_DB_PORT || process.env.DB_PORT || '5432', 10),
    database: process.env.TEST_ADMIN_DB_NAME || process.env.DB_NAME,
    user: process.env.TEST_ADMIN_DB_USER || 'postgres',
    password: process.env.TEST_ADMIN_DB_PASSWORD || process.env.DB_PASSWORD,
  });

  const rawPassword = process.env.DEV_PASSWORD;
  if (!rawPassword) {
    console.error('FATAL: DEV_PASSWORD environment variable must be supplied.');
    process.exit(1);
  }

  const client = await adminPool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    console.log('Restoring dev accounts (update-only mode)...');

    // ── 1. merchant01@ods.com ──
    const u1 = await client.query('SELECT id FROM users WHERE email = $1', ['merchant01@ods.com']);
    if (u1.rows.length === 0) {
      console.warn('  [SKIP] merchant01@ods.com not found in users (never creating new users)');
    } else {
      const u1Id = u1.rows[0].id;
      await client.query(
        'UPDATE users SET is_active = TRUE, password_hash = $1 WHERE id = $2',
        [passwordHash, u1Id]
      );

      const m1Check = await client.query('SELECT id FROM merchants WHERE user_id = $1', [u1Id]);
      if (m1Check.rows.length > 0) {
        await client.query(
          `UPDATE merchants SET business_name = 'Merchant 01 Retail', approval_status = 'approved',
           rejection_reason = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = NOW()
           WHERE id = $1`,
          [m1Check.rows[0].id]
        );
      }
      console.log('  [OK] merchant01@ods.com updated to approved');
    }

    // ── 2. merchant@123.com ──
    const u2 = await client.query('SELECT id FROM users WHERE email = $1', ['merchant@123.com']);
    if (u2.rows.length === 0) {
      console.warn('  [SKIP] merchant@123.com not found in users (never creating new users)');
    } else {
      const u2Id = u2.rows[0].id;
      await client.query(
        'UPDATE users SET is_active = TRUE, password_hash = $1 WHERE id = $2',
        [passwordHash, u2Id]
      );

      const m2Check = await client.query('SELECT id FROM merchants WHERE user_id = $1', [u2Id]);
      if (m2Check.rows.length > 0) {
        await client.query(
          `UPDATE merchants SET business_name = 'Merchant 123 Ltd', approval_status = 'approved',
           rejection_reason = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = NOW()
           WHERE id = $1`,
          [m2Check.rows[0].id]
        );
      }
      console.log('  [OK] merchant@123.com updated to approved');
    }

    // ── 3. serviceprovider@123.com ──
    const uP = await client.query('SELECT id FROM users WHERE email = $1', ['serviceprovider@123.com']);
    if (uP.rows.length === 0) {
      console.warn('  [SKIP] serviceprovider@123.com not found in users (never creating new users)');
    } else {
      const uPId = uP.rows[0].id;
      await client.query(
        'UPDATE users SET is_active = TRUE, password_hash = $1 WHERE id = $2',
        [passwordHash, uPId]
      );

      const pCheck = await client.query('SELECT id FROM providers WHERE user_id = $1', [uPId]);
      if (pCheck.rows.length > 0) {
        await client.query(
          `UPDATE providers SET provider_name = 'Care Diagnostics', provider_type = 'diagnostic_center',
           license_no = 'LIC-CD-001', approval_status = 'approved', rejection_reason = NULL,
           reviewed_by = NULL, reviewed_at = NULL, updated_at = NOW()
           WHERE id = $1`,
          [pCheck.rows[0].id]
        );
      }
      console.log('  [OK] serviceprovider@123.com updated to approved');
    }

    await client.query('COMMIT');
    console.log('Dev accounts restore complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to restore dev accounts:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await adminPool.end();
  }
}

restore();
