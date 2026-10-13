/**
 * ODS Global Network — Apply Limited DB User (ods_app)
 *
 * Connects as superuser/owner and provisions the least-privilege 'ods_app' role
 * with append-only audit_logs, full CRUD on documents, and DML on application tables.
 *
 * Usage:
 *   node scripts/apply-limited-user.js [password]
 */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');

async function main() {
  const adminUser = process.env.TEST_ADMIN_DB_USER || 'postgres';
  const adminPassword = process.env.TEST_ADMIN_DB_PASSWORD || 'postgres';
  const dbHost = process.env.TEST_ADMIN_DB_HOST || process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.TEST_ADMIN_DB_PORT || process.env.DB_PORT || '5432', 10);
  const dbName = process.env.TEST_ADMIN_DB_NAME || process.env.DB_NAME || 'ods_global';

  const appUser = 'ods_app';
  const appPassword = process.argv[2] || process.env.APP_PASSWORD || process.env.DB_PASSWORD;
  if (!appPassword) {
    console.error('FATAL: Limited user password must be supplied via CLI argument or APP_PASSWORD / DB_PASSWORD environment variable.');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL as superuser/admin (' + adminUser + ')...');

  const adminPool = new Pool({
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: adminUser,
    password: adminPassword,
  });

  try {
    const client = await adminPool.connect();
    console.log(`Connected to database '${dbName}'.`);

    // 1. Create role if not exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${appUser}') THEN
          CREATE ROLE ${appUser} WITH LOGIN;
        END IF;
      END $$;
    `);
    console.log(`Role '${appUser}' verified/created.`);

    // 2. Set password safely in DDL
    const escapedPassword = appPassword.replace(/'/g, "''");
    await client.query(`ALTER ROLE ${appUser} WITH PASSWORD '${escapedPassword}'`);
    console.log(`Password set for role '${appUser}'.`);

    // 3. Grant database connection and schema usage
    await client.query(`GRANT CONNECT ON DATABASE "${dbName}" TO ${appUser}`);
    await client.query(`GRANT USAGE ON SCHEMA public TO ${appUser}`);

    // 4. Grant table permissions
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO ${appUser}`);
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON addresses, contact_persons TO ${appUser}`);
    await client.query(`GRANT SELECT, INSERT, UPDATE ON users, merchants, providers, admins, partners, support_requests, otp_codes TO ${appUser}`);
    
    // Revoke any prior UPDATE/DELETE on audit_logs and grant strictly SELECT, INSERT
    await client.query(`REVOKE UPDATE, DELETE ON audit_logs FROM ${appUser}`);
    await client.query(`GRANT SELECT, INSERT ON audit_logs TO ${appUser}`);

    // Sequences
    await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${appUser}`);
    await client.query(`GRANT SELECT ON schema_migrations TO ${appUser}`);

    client.release();
    console.log(`Grants applied successfully for '${appUser}'.`);

    // 5. Verify connectivity as ods_app
    const verifyPool = new Pool({
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: appUser,
      password: appPassword,
    });

    const verifyRes = await verifyPool.query('SELECT current_user, session_user');
    console.log(`Verified connection as: ${verifyRes.rows[0].current_user}`);
    await verifyPool.end();

    console.log('\n[SUCCESS] ods_app is configured and verified.');
  } catch (err) {
    console.error('[ERROR] Failed to apply limited user:', err.message);
    process.exit(1);
  } finally {
    await adminPool.end();
  }
}

main();
