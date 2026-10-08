-- setup-limited-db-user.sql
-- Run as superuser in staging/production to provision a least-privilege DB role.
-- Usage: psql -U postgres -d ods_global -f scripts/setup-limited-db-user.sql

-- 1. Create limited application role if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ods_app_user') THEN
        CREATE ROLE ods_app_user WITH LOGIN PASSWORD 'SET_STRONG_APP_PASSWORD_HERE';
    END IF;
END $$;

-- 2. Grant connection and schema access
GRANT CONNECT ON DATABASE ods_global TO ods_app_user;
GRANT USAGE ON SCHEMA public TO ods_app_user;

-- 3. Grant table permissions (DML only, no DDL)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ods_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ods_app_user;

-- 4. Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ods_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ods_app_user;
