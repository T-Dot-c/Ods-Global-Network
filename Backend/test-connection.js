require('dotenv').config();
const { Pool } = require('pg');

async function test() {
  // Test 1 — try postgres18 (desired new password)
  let pool = new Pool({ host:'localhost', port:5432, user:'postgres', password:'postgres18', database:'postgres' });
  try {
    const r = await pool.query('SELECT current_user AS u, version() AS v');
    console.log('✅ PASSWORD "postgres18" WORKS');
    console.log('   User:', r.rows[0].u);
    console.log('   Server:', r.rows[0].v.split(',')[0]);
    await pool.end();
    return 'postgres18';
  } catch (e) {
    console.log('❌ postgres18 failed:', e.message);
    await pool.end();
  }

  // Could not connect
  console.log('\nThe password has not been changed yet.');
  console.log('Please run the Administrator PowerShell reset step first.');
}

test().catch(console.error);
