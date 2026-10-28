-- Migration 023: Unified Notification Engine, Outbox, Templates, and Preferences
-- ODS Global Network - Batch 11

-- 1. notification_events: ledger of domain business events created inside business transactions
CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(64) NOT NULL,
    subject_type VARCHAR(32) NOT NULL,
    subject_id VARCHAR(64) NOT NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_events_type ON notification_events(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_events_subject ON notification_events(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_created_at ON notification_events(created_at DESC);

-- 2. notification_templates: master list of message templates
CREATE TABLE IF NOT EXISTS notification_templates (
    key VARCHAR(64) PRIMARY KEY,
    channel VARCHAR(16) NOT NULL DEFAULT 'email',
    category VARCHAR(32) NOT NULL,
    is_essential BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. notification_template_versions: version history of templates (immutable per version)
CREATE TABLE IF NOT EXISTS notification_template_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(64) NOT NULL REFERENCES notification_templates(key) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    locale VARCHAR(8) NOT NULL DEFAULT 'en',
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    variables_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_template_version_locale UNIQUE (template_key, version, locale)
);

CREATE INDEX IF NOT EXISTS idx_notif_temp_active ON notification_template_versions(template_key, is_active, locale);

-- 4. notifications: core queue table and dispatch ledger
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES notification_events(id) ON DELETE CASCADE,
    recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_address VARCHAR(255) NOT NULL,
    channel VARCHAR(16) NOT NULL DEFAULT 'email',
    category VARCHAR(32) NOT NULL,
    template_key VARCHAR(64) NOT NULL REFERENCES notification_templates(key),
    template_version INT NOT NULL DEFAULT 1,
    locale VARCHAR(8) NOT NULL DEFAULT 'en',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 4,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_error TEXT,
    provider_message_id VARCHAR(128),
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    title VARCHAR(255),
    rendered_body TEXT,
    action_url VARCHAR(512),
    idempotency_key VARCHAR(160) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for worker queue polling and user inbox queries
CREATE INDEX IF NOT EXISTS idx_notifications_worker ON notifications(status, run_at, next_attempt_at)
WHERE status IN ('pending', 'retrying');

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_inbox ON notifications(recipient_user_id, channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 5. notification_attempts: detailed trace of each dispatch attempt
CREATE TABLE IF NOT EXISTS notification_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    attempt_no INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    error TEXT,
    provider_response_summary JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_attempts_nid ON notification_attempts(notification_id, created_at ASC);

-- 6. notification_preferences: user opt-in/opt-out configuration
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(32) NOT NULL,
    channel VARCHAR(16) NOT NULL DEFAULT 'email',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, category, channel)
);

-- 7. notification_suppressions: bounce, complaint, or manual suppressions
CREATE TABLE IF NOT EXISTS notification_suppressions (
    address VARCHAR(255) PRIMARY KEY,
    reason VARCHAR(64) NOT NULL,
    source VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add notification permissions to admin_permissions catalog
INSERT INTO admin_permissions (key, category, description) VALUES
    ('notifications.view', 'notifications', 'View notification dispatch logs and attempts'),
    ('notifications.manage', 'notifications', 'Manage dead-letter queue, retry and discard messages'),
    ('notifications.templates.manage', 'notifications', 'Manage, edit and preview notification templates'),
    ('notifications.suppressions.manage', 'notifications', 'Manage suppressed and bounced recipient addresses')
ON CONFLICT (key) DO NOTHING;

-- Grant notification permissions to System Administration and Support groups
INSERT INTO admin_group_permissions (group_id, permission_id)
SELECT g.id, p.id FROM admin_permission_groups g, admin_permissions p
WHERE g.name = 'System Administration' AND p.key IN (
    'notifications.view', 'notifications.manage', 'notifications.templates.manage', 'notifications.suppressions.manage'
)
ON CONFLICT DO NOTHING;

INSERT INTO admin_group_permissions (group_id, permission_id)
SELECT g.id, p.id FROM admin_permission_groups g, admin_permissions p
WHERE g.name = 'Support' AND p.key IN (
    'notifications.view', 'notifications.manage'
)
ON CONFLICT DO NOTHING;

-- Least-Privilege Grants to ods_app runtime role
GRANT SELECT, INSERT ON notification_events TO ods_app;
REVOKE UPDATE, DELETE, TRUNCATE ON notification_events FROM ods_app;

GRANT SELECT, INSERT ON notification_attempts TO ods_app;
REVOKE UPDATE, DELETE, TRUNCATE ON notification_attempts FROM ods_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON notification_templates, notification_template_versions, notification_preferences, notification_suppressions TO ods_app;
GRANT SELECT, INSERT, UPDATE ON notifications TO ods_app;
REVOKE DELETE, TRUNCATE ON notifications FROM ods_app;
