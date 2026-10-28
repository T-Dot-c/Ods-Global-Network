#!/usr/bin/env bash
# ODS Global Network — Database Backup Script (Linux / Production)
# Usage: ./scripts/backup-database.sh [database] [outdir]

set -euo pipefail

DB_NAME="${1:-${DB_NAME:-ods_global.net}}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${TEST_ADMIN_DB_USER:-${DB_USER:-postgres}}"
OUT_DIR="${2:-$(dirname "$0")/../backups}"

mkdir -p "$OUT_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${OUT_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql"

echo "================================================================"
echo "📦 STARTING DATABASE BACKUP: ${DB_NAME}"
echo "   Host: ${DB_HOST}:${DB_PORT} | User: ${DB_USER} | Output: ${BACKUP_FILE}"
echo "================================================================"

START_TIME=$(date +%s)

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --clean --if-exists --no-owner --no-privileges -f "$BACKUP_FILE"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
SIZE_KB=$(du -k "$BACKUP_FILE" | cut -f1)

echo "✅ BACKUP COMPLETED SUCCESSFULLY IN ${DURATION}s"
echo "   File: ${BACKUP_FILE} (${SIZE_KB} KB)"
echo "================================================================"
