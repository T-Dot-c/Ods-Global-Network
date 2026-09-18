-- 004_create_admins_table.sql
-- Admin role extension table. Invite-only / seeded, not created via public registration.

CREATE TABLE admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    admin_level     VARCHAR(20) NOT NULL DEFAULT 'staff',
    permissions     JSONB,   -- MVP shortcut; consider normalized roles/permissions tables as system grows

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_admin_level CHECK (admin_level IN ('staff','super_admin'))
);

CREATE INDEX idx_admins_user_id ON admins(user_id);
