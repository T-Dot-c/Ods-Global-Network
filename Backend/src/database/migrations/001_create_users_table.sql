-- 001_create_users_table.sql
-- Core identity/auth table. All roles (customer, merchant, provider, admin) authenticate here.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    full_name       VARCHAR(150)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255)    NOT NULL,
    role            VARCHAR(20)     NOT NULL DEFAULT 'customer',

    is_email_verified          BOOLEAN     NOT NULL DEFAULT FALSE,
    email_verification_token   VARCHAR(255),
    email_verification_expires TIMESTAMPTZ,

    is_phone_verified          BOOLEAN     NOT NULL DEFAULT FALSE,

    password_reset_token       VARCHAR(255),
    password_reset_expires     TIMESTAMPTZ,

    preferred_language      VARCHAR(10) DEFAULT 'en',
    notification_preference VARCHAR(20) DEFAULT 'email',

    is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
    failed_login_attempts   SMALLINT    NOT NULL DEFAULT 0,
    locked_until             TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ,

    CONSTRAINT chk_users_role CHECK (role IN ('customer','merchant','provider','admin'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);
