'use strict';
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.TEST_ADMIN_DB_HOST || process.env.DB_HOST,
  port: process.env.TEST_ADMIN_DB_PORT || process.env.DB_PORT,
  database: process.env.TEST_ADMIN_DB_NAME || process.env.DB_NAME,
  user: process.env.TEST_ADMIN_DB_USER || 'postgres',
  password: process.env.TEST_ADMIN_DB_PASSWORD,
  ssl: false,
});

async function main() {
  // Check all merchants with their real registration data
  const merchants = await pool.query(`
    SELECT u.email, u.full_name, u.role, m.id AS mid, m.business_name, m.category,
           m.business_type, m.approval_status, m.rejection_reason, m.reviewed_by,
           a.country, a.city, a.address_line, a.region_state
    FROM users u
    JOIN merchants m ON m.user_id = u.id
    LEFT JOIN addresses a ON a.entity_type = 'merchant' AND a.entity_id = m.id
    ORDER BY u.email
  `);
  console.log('\n=== ALL Merchants ===');
  console.log(JSON.stringify(merchants.rows, null, 2));

  // Check all providers
  const providers = await pool.query(`
    SELECT u.email, u.full_name, u.role, p.id AS pid, p.provider_name, p.provider_type,
           p.license_no, p.approval_status, p.rejection_reason, p.reviewed_by,
           a.country, a.city, a.address_line
    FROM users u
    JOIN providers p ON p.user_id = u.id
    LEFT JOIN addresses a ON a.entity_type = 'provider' AND a.entity_id = p.id
    ORDER BY u.email
  `);
  console.log('\n=== ALL Providers ===');
  console.log(JSON.stringify(providers.rows, null, 2));

  // Check all partners
  const partners = await pool.query(`
    SELECT id, name, company_name, email, partnership_type, document_id, created_at
    FROM partners ORDER BY created_at DESC LIMIT 20
  `);
  console.log('\n=== ALL Partners ===');
  console.log(JSON.stringify(partners.rows, null, 2));

  // Check all documents
  const docs = await pool.query(`
    SELECT id, entity_type, entity_id, purpose, file_name, status, is_attached,
           expires_at, SUBSTRING(storage_path, 1, 60) AS path_prefix
    FROM documents ORDER BY uploaded_at DESC LIMIT 20
  `);
  console.log('\n=== ALL Documents ===');
  console.log(JSON.stringify(docs.rows, null, 2));

  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
