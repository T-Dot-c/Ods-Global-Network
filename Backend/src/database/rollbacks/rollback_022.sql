-- Rollback 022: Drop Admin Console, Permissions, and Audit Log Tables
-- ODS Global Network

DROP TABLE IF EXISTS refund_approvals CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS user_admin_notes CASCADE;
DROP TABLE IF EXISTS admin_audit_log CASCADE;
DROP TABLE IF EXISTS admin_user_permissions CASCADE;
DROP TABLE IF EXISTS admin_user_groups CASCADE;
DROP TABLE IF EXISTS admin_group_permissions CASCADE;
DROP TABLE IF EXISTS admin_permission_groups CASCADE;
DROP TABLE IF EXISTS admin_permissions CASCADE;

-- Revert must_change_password column
ALTER TABLE users DROP COLUMN IF EXISTS must_change_password;
