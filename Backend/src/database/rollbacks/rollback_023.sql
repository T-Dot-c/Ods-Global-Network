-- Rollback 023: Drop Notification Engine Tables and Permissions
-- ODS Global Network - Batch 11

DROP TABLE IF EXISTS notification_attempts CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_template_versions CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notification_suppressions CASCADE;
DROP TABLE IF EXISTS notification_events CASCADE;

DELETE FROM admin_permissions WHERE key IN (
    'notifications.view',
    'notifications.manage',
    'notifications.templates.manage',
    'notifications.suppressions.manage'
);
