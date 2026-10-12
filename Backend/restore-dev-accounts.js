'use strict';
/**
 * Fix #2: Restore dev accounts to their original state, remove leftover
 * test fixtures from Phase 2 test runs.
 *
 * Dev accounts affected by Phase 2 tests:
 *   - merchant01@ods.com     → business_name restored, approval_status = pending, reviewer fields cleared
 *   - merchant@123.com       → same
 *   - serviceprovider@123.com ("Care Diagnostics" provider) → provider_name, license_no, approval_status = pending, reviewer fields cleared
 *
 * Leftover test fixtures to delete:
 *   - merchant_rbac_test@odsglobal.net (created by batch3 test, never cleaned up)
 *   - Any document rows with entity_type = 'unattached' or test-pattern file names
 *   - Any orphaned staging documents that have already expired
 *
 * Uses TEST_ADMIN_DB_* connection (owner-level) so ods_app is not touched.
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.TEST_ADMIN_DB_HOST || process.env.DB_HOST,
  port: process.env.TEST_ADMIN_DB_PORT || process.env.DB_PORT,
  database: process.env.TEST_ADMIN_DB_NAME || process.env.DB_NAME,
  user: process.env.TEST_ADMIN_DB_USER || 'postgres',
  password: process.env.TEST_ADMIN_DB_PASSWORD,
  ssl: false,
});

const UPLOADS_DIR = path.resolve(__dirname, 'uploads/private');

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('\n=== Fix #2: Restoring dev accounts & cleaning test fixtures ===\n');

    // ── 1. Restore merchant01@ods.com ────────────────────────────────────────
    // Original registration used email as business_name (placeholder) — that IS the original state.
    // Ensure approval_status = pending and reviewer fields are cleared (as they were at registration).
    const m1 = await client.query(
      `UPDATE merchants
       SET business_name   = 'Merchant01@ods.com',
           approval_status = 'pending',
           rejection_reason = NULL,
           reviewed_by     = NULL,
           reviewed_at     = NULL,
           updated_at      = NOW()
       WHERE user_id = (SELECT id FROM users WHERE email = 'merchant01@ods.com')
       RETURNING business_name, approval_status`
    );
    if (m1.rows.length > 0) {
      console.log('  ✅ merchant01@ods.com →', JSON.stringify(m1.rows[0]));
    } else {
      console.log('  ⚠️  merchant01@ods.com not found');
    }

    // Restore address for merchant01@ods.com to original registration values
    const m1addr = await client.query(
      `UPDATE addresses
       SET address_line = 'Merchant01@ods.com',
           city         = 'Addis Ababa',
           region_state = 'Addis Ababa',
           country      = 'Ethiopia',
           updated_at   = NOW()
       WHERE entity_type = 'merchant'
         AND entity_id = (
           SELECT m.id FROM merchants m
           JOIN users u ON u.id = m.user_id
           WHERE u.email = 'merchant01@ods.com'
         )
       RETURNING city, address_line`
    );
    if (m1addr.rows.length > 0) {
      console.log('  ✅ merchant01@ods.com address →', JSON.stringify(m1addr.rows[0]));
    }

    // ── 2. Restore merchant@123.com ──────────────────────────────────────────
    const m2 = await client.query(
      `UPDATE merchants
       SET business_name   = 'Merchant@123.com',
           approval_status = 'pending',
           rejection_reason = NULL,
           reviewed_by     = NULL,
           reviewed_at     = NULL,
           updated_at      = NOW()
       WHERE user_id = (SELECT id FROM users WHERE email = 'merchant@123.com')
       RETURNING business_name, approval_status`
    );
    if (m2.rows.length > 0) {
      console.log('  ✅ merchant@123.com →', JSON.stringify(m2.rows[0]));
    } else {
      console.log('  ⚠️  merchant@123.com not found');
    }

    const m2addr = await client.query(
      `UPDATE addresses
       SET address_line = 'Merchant@123.com',
           city         = 'Addis Ababa',
           region_state = 'Addis Ababa',
           country      = 'Ethiopia',
           updated_at   = NOW()
       WHERE entity_type = 'merchant'
         AND entity_id = (
           SELECT m.id FROM merchants m
           JOIN users u ON u.id = m.user_id
           WHERE u.email = 'merchant@123.com'
         )
       RETURNING city, address_line`
    );
    if (m2addr.rows.length > 0) {
      console.log('  ✅ merchant@123.com address →', JSON.stringify(m2addr.rows[0]));
    }

    // ── 3. Restore serviceprovider@123.com (Care Diagnostics / original name) ──
    const p1 = await client.query(
      `UPDATE providers
       SET provider_name    = 'ServiceProvider@123.com',
           provider_type    = 'hospital',
           license_no       = 'ServiceProvider@123.com',
           approval_status  = 'pending',
           rejection_reason = NULL,
           reviewed_by      = NULL,
           reviewed_at      = NULL,
           updated_at       = NOW()
       WHERE user_id = (SELECT id FROM users WHERE email = 'serviceprovider@123.com')
       RETURNING provider_name, license_no, approval_status`
    );
    if (p1.rows.length > 0) {
      console.log('  ✅ serviceprovider@123.com →', JSON.stringify(p1.rows[0]));
    } else {
      console.log('  ⚠️  serviceprovider@123.com not found');
    }

    const p1addr = await client.query(
      `UPDATE addresses
       SET address_line = 'ServiceProvider@123.com',
           city         = 'Addis Ababa',
           country      = 'Ethiopia',
           updated_at   = NOW()
       WHERE entity_type = 'provider'
         AND entity_id = (
           SELECT p.id FROM providers p
           JOIN users u ON u.id = p.user_id
           WHERE u.email = 'serviceprovider@123.com'
         )
       RETURNING city, address_line`
    );
    if (p1addr.rows.length > 0) {
      console.log('  ✅ serviceprovider@123.com address →', JSON.stringify(p1addr.rows[0]));
    }

    // ── 4. Clean up leftover test users from Phase 2 batch runs ─────────────
    // Identify all test-pattern users (timestamp-email or _rbac_test pattern)
    const testUsers = await client.query(
      `SELECT id, email, role FROM users
       WHERE email ILIKE '%_test@odsglobal.net%'
          OR email ILIKE 'test_%@odsglobal.net'
       ORDER BY email`
    );
    console.log(`\n  Found ${testUsers.rows.length} test user(s) to clean up:`);

    for (const u of testUsers.rows) {
      console.log(`    Deleting: ${u.email} (${u.role})`);
      if (u.role === 'merchant') {
        const mRes = await client.query(`SELECT id FROM merchants WHERE user_id = $1`, [u.id]);
        if (mRes.rows.length > 0) {
          const mId = mRes.rows[0].id;
          // Delete attached documents (and their disk files)
          const docsRes = await client.query(
            `DELETE FROM documents WHERE entity_type = 'merchant' AND entity_id = $1 RETURNING storage_path`,
            [mId]
          );
          for (const doc of docsRes.rows) {
            if (doc.storage_path && fs.existsSync(doc.storage_path)) {
              fs.unlinkSync(doc.storage_path);
              console.log(`      Unlinked file: ${doc.storage_path}`);
            }
          }
          await client.query(`DELETE FROM contact_persons WHERE entity_type = 'merchant' AND entity_id = $1`, [mId]);
          await client.query(`DELETE FROM addresses WHERE entity_type = 'merchant' AND entity_id = $1`, [mId]);
          await client.query(`DELETE FROM merchants WHERE id = $1`, [mId]);
        }
      } else if (u.role === 'provider') {
        const pRes = await client.query(`SELECT id FROM providers WHERE user_id = $1`, [u.id]);
        if (pRes.rows.length > 0) {
          const pId = pRes.rows[0].id;
          const docsRes = await client.query(
            `DELETE FROM documents WHERE entity_type = 'provider' AND entity_id = $1 RETURNING storage_path`,
            [pId]
          );
          for (const doc of docsRes.rows) {
            if (doc.storage_path && fs.existsSync(doc.storage_path)) {
              fs.unlinkSync(doc.storage_path);
              console.log(`      Unlinked file: ${doc.storage_path}`);
            }
          }
          await client.query(`DELETE FROM contact_persons WHERE entity_type = 'provider' AND entity_id = $1`, [pId]);
          await client.query(`DELETE FROM addresses WHERE entity_type = 'provider' AND entity_id = $1`, [pId]);
          await client.query(`DELETE FROM providers WHERE id = $1`, [pId]);
        }
      } else if (u.role === 'customer') {
        await client.query(`DELETE FROM addresses WHERE entity_type = 'customer' AND entity_id = $1`, [u.id]);
      }
      await client.query(`DELETE FROM audit_logs WHERE user_id = $1`, [u.id]);
      await client.query(`DELETE FROM users WHERE id = $1`, [u.id]);
    }

    // ── 5. Clean up expired unattached staging documents ─────────────────────
    const expiredDocs = await client.query(
      `DELETE FROM documents
       WHERE is_attached = FALSE AND expires_at IS NOT NULL AND expires_at <= NOW()
       RETURNING id, storage_path`
    );
    if (expiredDocs.rows.length > 0) {
      console.log(`\n  Cleaned ${expiredDocs.rows.length} expired staging document(s):`);
      for (const doc of expiredDocs.rows) {
        if (doc.storage_path && fs.existsSync(doc.storage_path)) {
          fs.unlinkSync(doc.storage_path);
          console.log(`    Unlinked file: ${doc.storage_path}`);
        }
      }
    } else {
      console.log('\n  No expired staging documents found (clean).');
    }

    // ── 6. Clean up any leftover test partners (none expected, but safety check) ─
    const testPartners = await client.query(
      `DELETE FROM partners
       WHERE name ILIKE '%test%' OR email ILIKE '%test%@odsglobal.net%'
       RETURNING id, name, email`
    );
    if (testPartners.rows.length > 0) {
      console.log(`\n  Cleaned ${testPartners.rows.length} test partner(s).`);
    } else {
      console.log('  No test partner records found (clean).');
    }

    await client.query('COMMIT');
    console.log('\n=== Restore complete. Verifying final state... ===\n');

    // ── 7. Final verification query ──────────────────────────────────────────
    const verify = await pool.query(
      `SELECT u.email, u.role,
              COALESCE(m.business_name, p.provider_name) AS entity_name,
              COALESCE(m.approval_status, p.approval_status) AS status,
              COALESCE(m.reviewed_by::text, p.reviewed_by::text) AS reviewed_by,
              a.city, a.address_line
       FROM users u
       LEFT JOIN merchants m ON m.user_id = u.id
       LEFT JOIN providers p ON p.user_id = u.id
       LEFT JOIN addresses a ON (
         (a.entity_type = 'merchant' AND a.entity_id = m.id) OR
         (a.entity_type = 'provider' AND a.entity_id = p.id)
       )
       WHERE u.email IN (
         'merchant01@ods.com', 'merchant@123.com', 'serviceprovider@123.com'
       )
       ORDER BY u.email`
    );
    console.log('Dev accounts final state:');
    console.log(JSON.stringify(verify.rows, null, 2));

    const remainingTest = await pool.query(
      `SELECT email, role FROM users
       WHERE email ILIKE '%_test@odsglobal.net%' OR email ILIKE 'test_%@odsglobal.net'`
    );
    console.log(`\nRemaining test users: ${remainingTest.rows.length} (expected 0)`);

    const remainingDocs = await pool.query(`SELECT COUNT(*) AS c FROM documents`);
    console.log(`Total documents in DB: ${remainingDocs.rows[0].c} (expected 0)`);

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('RESTORE FAILED:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
