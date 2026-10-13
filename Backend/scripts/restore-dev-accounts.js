/**
 * ODS Global Network — Restore Dev Accounts
 *
 * Restores the standard dev testing accounts with known dev passwords and 'approved' status:
 *   1. merchant01@ods.com (Merchant 01 Retail)
 *   2. merchant@123.com   (Merchant 123 Ltd)
 *   3. Care Diagnostics provider (carediagnostics@ods.com and serviceprovider@123.com)
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
    database: process.env.TEST_ADMIN_DB_NAME || process.env.DB_NAME || 'ods_global',
    user: process.env.TEST_ADMIN_DB_USER || 'postgres',
    password: process.env.TEST_ADMIN_DB_PASSWORD || process.env.DB_PASSWORD,
  });

  const client = await adminPool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await bcrypt.hash('Password123!', 10);

    console.log('Restoring dev accounts...');

    // ── 1. merchant01@ods.com ──
    let u1 = await client.query('SELECT id FROM users WHERE email = $1', ['merchant01@ods.com']);
    let u1Id;
    if (u1.rows.length === 0) {
      const ins1 = await client.query(
        `INSERT INTO users (email, password_hash, full_name, role, is_active)
         VALUES ($1, $2, 'Merchant 01 User', 'merchant', TRUE) RETURNING id`,
        ['merchant01@ods.com', passwordHash]
      );
      u1Id = ins1.rows[0].id;
    } else {
      u1Id = u1.rows[0].id;
      await client.query(
        `UPDATE users SET is_active = TRUE, password_hash = $1 WHERE id = $2`,
        [passwordHash, u1Id]
      );
    }

    const m1Check = await client.query('SELECT id FROM merchants WHERE user_id = $1', [u1Id]);
    let m1Id;
    if (m1Check.rows.length === 0) {
      const insM1 = await client.query(
        `INSERT INTO merchants (user_id, business_name, business_type, category, approval_status, business_email)
         VALUES ($1, 'Merchant 01 Retail', 'retailer', 'General', 'approved', 'merchant01@ods.com')
         RETURNING id`,
        [u1Id]
      );
      m1Id = insM1.rows[0].id;
    } else {
      m1Id = m1Check.rows[0].id;
      await client.query(
        `UPDATE merchants SET business_name = 'Merchant 01 Retail', approval_status = 'approved',
         rejection_reason = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = NOW()
         WHERE id = $1`,
        [m1Id]
      );
    }

    await client.query(
      `INSERT INTO addresses (entity_type, entity_id, address_line, city, country)
       VALUES ('merchant', $1, 'Bole Medhanialem', 'Addis Ababa', 'Ethiopia')
       ON CONFLICT DO NOTHING`,
      [m1Id]
    );
    console.log('  [OK] merchant01@ods.com restored to approved');

    // ── 2. merchant@123.com ──
    let u2 = await client.query('SELECT id FROM users WHERE email = $1', ['merchant@123.com']);
    let u2Id;
    if (u2.rows.length === 0) {
      const ins2 = await client.query(
        `INSERT INTO users (email, password_hash, full_name, role, is_active)
         VALUES ($1, $2, 'Merchant 123 User', 'merchant', TRUE) RETURNING id`,
        ['merchant@123.com', passwordHash]
      );
      u2Id = ins2.rows[0].id;
    } else {
      u2Id = u2.rows[0].id;
      await client.query(
        `UPDATE users SET is_active = TRUE, password_hash = $1 WHERE id = $2`,
        [passwordHash, u2Id]
      );
    }

    const m2Check = await client.query('SELECT id FROM merchants WHERE user_id = $1', [u2Id]);
    let m2Id;
    if (m2Check.rows.length === 0) {
      const insM2 = await client.query(
        `INSERT INTO merchants (user_id, business_name, business_type, category, approval_status, business_email)
         VALUES ($1, 'Merchant 123 Ltd', 'retailer', 'General', 'approved', 'merchant@123.com')
         RETURNING id`,
        [u2Id]
      );
      m2Id = insM2.rows[0].id;
    } else {
      m2Id = m2Check.rows[0].id;
      await client.query(
        `UPDATE merchants SET business_name = 'Merchant 123 Ltd', approval_status = 'approved',
         rejection_reason = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = NOW()
         WHERE id = $1`,
        [m2Id]
      );
    }

    await client.query(
      `INSERT INTO addresses (entity_type, entity_id, address_line, city, country)
       VALUES ('merchant', $1, 'Bole Road', 'Addis Ababa', 'Ethiopia')
       ON CONFLICT DO NOTHING`,
      [m2Id]
    );
    console.log('  [OK] merchant@123.com restored to approved');

    // ── 3. Care Diagnostics provider (carediagnostics@ods.com & serviceprovider@123.com) ──
    for (const pEmail of ['carediagnostics@ods.com', 'serviceprovider@123.com']) {
      let uP = await client.query('SELECT id FROM users WHERE email = $1', [pEmail]);
      let uPId;
      if (uP.rows.length === 0) {
        const insP = await client.query(
          `INSERT INTO users (email, password_hash, full_name, role, is_active)
           VALUES ($1, $2, 'Care Diagnostics Admin', 'provider', TRUE) RETURNING id`,
          [pEmail, passwordHash]
        );
        uPId = insP.rows[0].id;
      } else {
        uPId = uP.rows[0].id;
        await client.query(
          `UPDATE users SET is_active = TRUE, password_hash = $1 WHERE id = $2`,
          [passwordHash, uPId]
        );
      }

      const pCheck = await client.query('SELECT id FROM providers WHERE user_id = $1', [uPId]);
      let pId;
      if (pCheck.rows.length === 0) {
        const insProv = await client.query(
          `INSERT INTO providers (user_id, provider_name, provider_type, license_no, approval_status, official_email)
           VALUES ($1, 'Care Diagnostics', 'diagnostic_center', 'LIC-CD-001', 'approved', $2)
           RETURNING id`,
          [uPId, pEmail]
        );
        pId = insProv.rows[0].id;
      } else {
        pId = pCheck.rows[0].id;
        await client.query(
          `UPDATE providers SET provider_name = 'Care Diagnostics', provider_type = 'diagnostic_center',
           license_no = 'LIC-CD-001', approval_status = 'approved', rejection_reason = NULL,
           reviewed_by = NULL, reviewed_at = NULL, updated_at = NOW()
           WHERE id = $1`,
          [pId]
        );
      }

      await client.query(
        `INSERT INTO addresses (entity_type, entity_id, address_line, city, country)
         VALUES ('provider', $1, 'Kazanchis St', 'Addis Ababa', 'Ethiopia')
         ON CONFLICT DO NOTHING`,
        [pId]
      );
      console.log(`  [OK] Care Diagnostics (${pEmail}) restored to approved`);
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
