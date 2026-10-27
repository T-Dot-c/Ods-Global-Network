-- Migration 022: Full Admin Console, Granular Permissions, Audit Log & Operational Oversight
-- ODS Global Network

-- 1. admin_permissions: master catalog of granular permissions
CREATE TABLE IF NOT EXISTS admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(64) UNIQUE NOT NULL,
    category VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. admin_permission_groups: predefined roles (Support, Compliance, Finance, etc.)
CREATE TABLE IF NOT EXISTS admin_permission_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. admin_group_permissions: junction between groups and permission keys
CREATE TABLE IF NOT EXISTS admin_group_permissions (
    group_id UUID NOT NULL REFERENCES admin_permission_groups(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, permission_id)
);

-- 4. admin_user_groups: assigned groups per admin user
CREATE TABLE IF NOT EXISTS admin_user_groups (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES admin_permission_groups(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, group_id)
);

-- 5. admin_user_permissions: optional direct grant/deny overrides
CREATE TABLE IF NOT EXISTS admin_user_permissions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN NOT NULL DEFAULT TRUE,
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, permission_id)
);

-- 6. admin_audit_log: append-only immutable audit trail
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    permission_key VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. user_admin_notes: internal notes on users/providers
CREATE TABLE IF NOT EXISTS user_admin_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. refund_approvals: two-person approval workflow for large refunds
CREATE TABLE IF NOT EXISTS refund_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    booking_id UUID REFERENCES bookings(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    status VARCHAR(30) NOT NULL DEFAULT 'pending_approval', -- pending_approval, approved, rejected
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    request_reason TEXT NOT NULL,
    decision_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ
);

-- 9. platform_settings: typed configuration key-value store
CREATE TABLE IF NOT EXISTS platform_settings (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    value_type VARCHAR(20) NOT NULL, -- integer, string, boolean, json
    description TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add must_change_password column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Indexes for performant list and audit queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor_created ON admin_audit_log(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action_created ON admin_audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_admin_notes_user ON user_admin_notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refund_approvals_status ON refund_approvals(status);

-- Seed Default Granular Permissions
INSERT INTO admin_permissions (key, category, description) VALUES
    -- Support
    ('users.view', 'support', 'View users list and profiles'),
    ('bookings.view', 'support', 'View appointment bookings list and details'),
    ('gifts.view', 'support', 'View gift cards list and details'),
    ('payments.view', 'support', 'View transaction ledger entries'),
    ('users.notes_add', 'support', 'Add internal notes to user accounts'),

    -- Compliance
    ('kyc.queue_view', 'compliance', 'View merchant and provider KYC submission queue'),
    ('kyc.document_view', 'compliance', 'Inspect uploaded compliance verification documents'),
    ('kyc.decide', 'compliance', 'Approve, reject, or request information on KYC submissions'),
    ('providers.review', 'compliance', 'Manage provider accreditation and compliance status'),

    -- Catalog Moderation
    ('services.view', 'catalog', 'View services catalog list and details'),
    ('services.moderate', 'catalog', 'Approve, reject, take down, or restore published services'),
    ('categories.manage', 'catalog', 'Create, update, and manage service taxonomy categories'),

    -- Finance
    ('payments.view_ledger', 'finance', 'Access full financial transactions and reconciliation ledger'),
    ('refunds.initiate', 'finance', 'Initiate customer booking and gift refunds'),
    ('refunds.approve', 'finance', 'Approve large refunds requiring two-person authorization'),
    ('reports.financial_export', 'finance', 'Export financial and transaction datasets to CSV'),

    -- Operations
    ('bookings.manage', 'operations', 'Mark bookings completed, no-show, or administrative cancellation'),
    ('bookings.cancel_override', 'operations', 'Override booking cancellation refund amounts'),
    ('bookings.resolve_conflict', 'operations', 'Resolve late-payment booking conflicts'),
    ('gifts.manage', 'operations', 'Extend validity or cancel unredeemed gift vouchers'),
    ('gifts.reveal_code', 'operations', 'Reveal full unmasked gift card voucher codes with audit log'),

    -- User Administration
    ('users.manage', 'user_admin', 'Manage user accounts, contact details, and account state'),
    ('users.suspend', 'user_admin', 'Suspend or reactivate customer, merchant, and provider accounts'),
    ('users.force_signout', 'user_admin', 'Invalidate all active sessions across devices for a user'),
    ('users.reset_password', 'user_admin', 'Dispatch administrative password reset links'),
    ('users.change_role', 'user_admin', 'Promote or demote user system roles'),

    -- System
    ('admins.manage', 'system', 'Provision and configure staff administrator accounts and permissions'),
    ('settings.manage', 'system', 'Modify platform operational configurations and parameters'),
    ('audit.view', 'system', 'Inspect full platform security and operational audit logs')
ON CONFLICT (key) DO NOTHING;

-- Seed Predefined Permission Groups
INSERT INTO admin_permission_groups (name, description) VALUES
    ('Support', 'First-line support staff: view users, bookings, gifts, payments, and add internal notes'),
    ('Compliance', 'Compliance officers: review KYC queues, inspect documents, make approval/rejection decisions'),
    ('Catalog Moderation', 'Catalog curators: review services, approve/reject/take down listings, manage categories'),
    ('Finance', 'Finance and accounting officers: financial ledger, refund issuance and two-person approval, financial exports'),
    ('Operations', 'Platform operations: booking oversight, dispute handling, late-payment resolution, gift management'),
    ('User Administration', 'User administrators: account suspension, reactivation, force sign-out, role updates'),
    ('System Administration', 'Super administrators and system managers: staff provisioning, platform settings, audit logs')
ON CONFLICT (name) DO NOTHING;

-- Map Permissions to Groups
-- Support Group
INSERT INTO admin_group_permissions (group_id, permission_id)
SELECT g.id, p.id FROM admin_permission_groups g, admin_permissions p
WHERE g.name = 'Support' AND p.key IN ('users.view', 'bookings.view', 'gifts.view', 'payments.view', 'users.notes_add')
ON CONFLICT DO NOTHING;

-- Compliance Group
INSERT INTO admin_group_permissions (group_id, permission_id)
SELECT g.id, p.id FROM admin_permission_groups g, admin_permissions p
WHERE g.name = 'Compliance' AND p.key IN ('kyc.queue_view', 'kyc.document_view', 'kyc.decide', 'providers.review', 'users.view')
ON CONFLICT DO NOTHING;

-- Catalog Moderation Group
INSERT INTO admin_group_permissions (group_id, permission_id)
SELECT g.id, p.id FROM admin_permission_groups g, admin_permissions p
WHERE g.name = 'Catalog Moderation' AND p.key IN ('services.view', 'services.moderate', 'categories.manage')
ON CONFLICT DO NOTHING;

-- Finance Group
INSERT INTO admin_group_permissions (group_id, permission_id)
SELECT g.id, p.id FROM admin_permission_groups g, admin_permissions p
WHERE g.name = 'Finance' AND p.key IN ('payments.view_ledger', 'refunds.initiate', 'refunds.approve', 'reports.financial_export', 'bookings.view')
ON CONFLICT DO NOTHING;

-- Operations Group
INSERT INTO admin_group_permissions (group_id, permission_id)
SELECT g.id, p.id FROM admin_permission_groups g, admin_permissions p
WHERE g.name = 'Operations' AND p.key IN ('bookings.manage', 'bookings.cancel_override', 'bookings.resolve_conflict', 'gifts.manage', 'gifts.reveal_code', 'bookings.view', 'gifts.view')
ON CONFLICT DO NOTHING;

-- User Administration Group
INSERT INTO admin_group_permissions (group_id, permission_id)
SELECT g.id, p.id FROM admin_permission_groups g, admin_permissions p
WHERE g.name = 'User Administration' AND p.key IN ('users.manage', 'users.suspend', 'users.force_signout', 'users.reset_password', 'users.change_role', 'users.view')
ON CONFLICT DO NOTHING;

-- System Administration Group (all permissions)
INSERT INTO admin_group_permissions (group_id, permission_id)
SELECT g.id, p.id FROM admin_permission_groups g, admin_permissions p
WHERE g.name = 'System Administration'
ON CONFLICT DO NOTHING;

-- Seed Default Platform Settings
INSERT INTO platform_settings (key, value, value_type, description) VALUES
    ('booking_hold_duration_minutes', '10'::jsonb, 'integer', 'Checkout slot hold reservation window in minutes'),
    ('booking_max_advance_days', '60'::jsonb, 'integer', 'Maximum advance window for scheduling appointments in days'),
    ('booking_reschedule_limit', '2'::jsonb, 'integer', 'Maximum times a customer can reschedule a single booking'),
    ('booking_reschedule_cutoff_hours', '2'::jsonb, 'integer', 'Minimum hours before start_at required to reschedule'),
    ('refund_two_person_threshold_etb', '10000'::jsonb, 'integer', 'ETB threshold requiring second approver for refunds'),
    ('gift_card_default_validity_days', '365'::jsonb, 'integer', 'Default validity period for gift card vouchers in days'),
    ('maintenance_mode', 'false'::jsonb, 'boolean', 'Whether platform is in maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- Least-Privilege Grants to ods_app runtime role
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_permissions, admin_permission_groups, admin_group_permissions, admin_user_groups, admin_user_permissions, user_admin_notes, refund_approvals, platform_settings, admins TO ods_app;
GRANT SELECT, INSERT ON admin_audit_log TO ods_app;
REVOKE UPDATE, DELETE, TRUNCATE ON admin_audit_log FROM ods_app;
