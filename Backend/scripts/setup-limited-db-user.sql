-- setup-limited-db-user.sql
-- Run as superuser in staging/production/dev to provision a least-privilege DB role.
-- Usage: psql -U postgres -d "ods_global.net" -v app_password='YOUR_STRONG_PASSWORD' -f scripts/setup-limited-db-user.sql

\if :{?app_password}
\else
    \echo 'FATAL: Variable app_password must be defined. Usage: psql -U postgres -d "ods_global.net" -v app_password="YOUR_PASSWORD" -f scripts/setup-limited-db-user.sql'
    \quit 1
\endif

-- 1. Create limited application role if not exists and set supplied password
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ods_app') THEN
        CREATE ROLE ods_app WITH LOGIN;
    END IF;
END $$;

ALTER ROLE ods_app WITH PASSWORD :'app_password';

-- 2. Grant connection and schema access
GRANT CONNECT ON DATABASE "ods_global.net" TO ods_app;
GRANT USAGE ON SCHEMA public TO ods_app;

-- 3. Grant table permissions (DML only, append-only for audit_logs)
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO ods_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON addresses, contact_persons TO ods_app;
GRANT SELECT, INSERT, UPDATE ON users, merchants, providers, admins, partners, support_requests, otp_codes TO ods_app;
GRANT SELECT, INSERT ON audit_logs TO ods_app; -- strictly append-only, no UPDATE or DELETE
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ods_app;

-- 4. Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO ods_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ods_app;
