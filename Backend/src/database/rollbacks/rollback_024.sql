-- Rollback Migration 024: Production Hardening Tables
-- ODS Global Network - Batch 12

DROP TABLE IF EXISTS admin_2fa_secrets CASCADE;
DROP TABLE IF EXISTS rate_limit_buckets CASCADE;

DELETE FROM schema_migrations WHERE filename = '024_create_production_hardening_tables.sql';
