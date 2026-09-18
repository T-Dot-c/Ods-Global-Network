/**
 * ODS Global Network — Database Migration Runner
 *
 * Runs all .sql files in ./migrations/ in filename order.
 * Each migration is tracked in the `schema_migrations` table.
 * Already-applied migrations are skipped (idempotent).
 *
 * Usage:
 *   node src/database/migrate.js
 */
'use strict';

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('../db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          SERIAL PRIMARY KEY,
      filename    VARCHAR(255) NOT NULL UNIQUE,
      applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query('SELECT filename FROM schema_migrations ORDER BY filename');
  return new Set(result.rows.map(r => r.filename));
}

async function run() {
  const client = await pool.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`\n📂 Found ${files.length} migration file(s) in ./migrations/\n`);

    let ran = 0;
    let skipped = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  ⏭  Skipping (already applied): ${file}`);
        skipped++;
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql      = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`  ✅  Applied: ${file}`);
        ran++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ❌  Failed:  ${file}`);
        console.error(`      ${err.message}`);
        process.exit(1);
      }
    }

    console.log(`\n✅ Migration complete. Applied: ${ran}  |  Skipped: ${skipped}\n`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('\n❌ Migration runner error:', err.message);
  process.exit(1);
});
