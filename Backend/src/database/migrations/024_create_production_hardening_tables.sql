-- Migration 024: Production Hardening Tables (Persistent Rate Limiting & Admin 2FA)
-- ODS Global Network - Batch 12

-- 1. Persistent Shared Rate Limit Buckets
-- Supports atomic token bucket algorithm and sliding window rate limiting across restarts and multi-node instances.
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
    key VARCHAR(255) PRIMARY KEY,
    points INT NOT NULL DEFAULT 1,
    expire_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_expire ON rate_limit_buckets(expire_at);

-- 2. Admin Two-Factor Authentication Secrets (RFC 6238 TOTP)
-- Stores TOTP base32 secret and single-use hashed recovery codes for admin roles.
CREATE TABLE IF NOT EXISTS admin_2fa_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret_base32 VARCHAR(128) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    recovery_hashes TEXT[] NOT NULL DEFAULT '{}',
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_admin_2fa_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_2fa_user ON admin_2fa_secrets(user_id);

-- 3. Explicit Least-Privilege Grants for ods_app runtime role
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ods_app') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limit_buckets TO ods_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON admin_2fa_secrets TO ods_app;
    END IF;
END
$$;
