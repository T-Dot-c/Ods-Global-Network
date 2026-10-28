#!/usr/bin/env bash
# ODS Global Network — Database Restore Script (Linux / Production)
# Usage: ./scripts/restore-database.sh <backup_file> [target_db]

set -euo pipefail

BACKUP_FILE="${1:?Backup file path is required}"
TARGET_DB="${2:-ods_staging_restore_test}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${TEST_ADMIN_DB_USER:-${DB_USER:-postgres}}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "================================================================"
echo "🔄 STARTING DATABASE RESTORE REHEARSAL"
echo "   Source: ${BACKUP_FILE}"
echo "   Target DB: ${TARGET_DB} on ${DB_HOST}:${DB_PORT} (User: ${DB_USER})"
echo "================================================================"

START_TIME=$(date +%s)

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS ${TARGET_DB};"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE ${TARGET_DB};"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -q -f "$BACKUP_FILE"

TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "================================================================"
echo "✅ RESTORE REHEARSAL COMPLETED SUCCESSFULLY IN ${DURATION}s"
echo "   Restored Database: ${TARGET_DB} (${TABLE_COUNT// /} public tables verified)"
echo "================================================================"
