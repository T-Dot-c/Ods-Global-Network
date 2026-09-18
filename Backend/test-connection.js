/**
 * ODS Global Network — Database Health & Connection Check
 * Run from ./Backend with:
 *    node test-connection.js
 */
'use strict';

require('dotenv').config();
const pool = require('./src/db');

async function checkDatabase() {
  console.log('\n=============================================');
  console.log('  ODS Global Network — Database Health Check');
  console.log('=============================================\n');

  try {
    // 1. Basic connection & server version
    const serverInfo = await pool.query(`
      SELECT 
        current_database() AS db_name,
        current_user AS db_user,
        inet_server_addr() AS server_ip,
        inet_server_port() AS server_port,
        version() AS version
    `);
    const info = serverInfo.rows[0];

    console.log('✅ PostgreSQL Connection: SUCCESS');
    console.log(`   Database Name : ${info.db_name}`);
    console.log(`   Database User : ${info.db_user}`);
    console.log(`   Port          : ${info.server_port || '5432'}`);
    console.log(`   PostgreSQL    : ${info.version.split('on')[0].trim()}`);

    // 2. Migration table status
    const migrations = await pool.query('SELECT count(*) FROM schema_migrations');
    console.log(`\n✅ Migrations     : ${migrations.rows[0].count} applied`);

    // 3. Check core tables
    const users = await pool.query('SELECT count(*) FROM users');
    const merchants = await pool.query('SELECT count(*) FROM merchants');
    const providers = await pool.query('SELECT count(*) FROM providers');

    console.log('\n📊 Table Records:');
    console.log(`   • users           : ${users.rows[0].count}`);
    console.log(`   • merchants       : ${merchants.rows[0].count}`);
    console.log(`   • providers       : ${providers.rows[0].count}`);

    // 4. Sample admin check
    const admin = await pool.query("SELECT email, role, is_active FROM users WHERE role = 'admin' LIMIT 1");
    if (admin.rows.length > 0) {
      console.log(`\n🛡️ Admin Account  : Found (${admin.rows[0].email}) — Active: ${admin.rows[0].is_active}`);
    }

    console.log('\n=============================================');
    console.log('🎉 Database is fully operational and healthy!');
    console.log('=============================================\n');
  } catch (err) {
    console.error('\n❌ Database Connection FAILED:');
    console.error(`   Error Message: ${err.message}`);
    console.error('\nTips:');
    console.error('   1. Verify PostgreSQL service is running.');
    console.error('   2. Check credentials in Backend/.env (DB_PASSWORD, DB_NAME).');
    console.error('=============================================\n');
  } finally {
    await pool.end();
  }
}

checkDatabase();
