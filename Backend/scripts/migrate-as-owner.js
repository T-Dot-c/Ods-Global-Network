/**
 * ODS Global Network — Migration Runner as Owner/Admin
 *
 * Runs src/database/migrate.js under TEST_ADMIN_DB_* credentials.
 * Ensures migrations that alter tables or grant privileges succeed with owner rights.
 * Never prints credentials.
 */
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ownerUser = process.env.TEST_ADMIN_DB_USER;
const ownerPass = process.env.TEST_ADMIN_DB_PASSWORD;

if (!ownerUser || !ownerPass) {
  console.error('[FATAL] Missing required owner credentials: TEST_ADMIN_DB_USER and TEST_ADMIN_DB_PASSWORD must be defined in .env.');
  process.exit(1);
}

// Map owner credentials to DB_USER and DB_PASSWORD while preserving DB_HOST, DB_PORT, DB_NAME
const ownerEnv = {
  ...process.env,
  DB_USER: ownerUser,
  DB_PASSWORD: ownerPass,
};

const backendDir = path.join(__dirname, '..');
const migrateScript = path.join(backendDir, 'src', 'database', 'migrate.js');

console.log(`[migrate-as-owner] Running migrate.js as database owner (${ownerUser})...`);

const result = spawnSync(process.execPath, [migrateScript], {
  cwd: backendDir,
  env: ownerEnv,
  stdio: 'inherit',
});

if (result.error) {
  console.error('[migrate-as-owner] Failed to execute migrate.js:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
