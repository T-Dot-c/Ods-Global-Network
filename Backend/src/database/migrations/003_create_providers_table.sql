-- 003_create_providers_table.sql
-- Service Provider role extension table.

CREATE TABLE providers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    provider_name       VARCHAR(200) NOT NULL,
    provider_type       VARCHAR(50)  NOT NULL,
    service_category    VARCHAR(100),
    official_phone      VARCHAR(20),
    official_email      VARCHAR(255),
    website              VARCHAR(255),
    description          TEXT,

    services_offered    TEXT,
    operating_hours     VARCHAR(100),
    availability        VARCHAR(50),

    license_no          VARCHAR(100),
    approval_status      VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by          UUID REFERENCES users(id),
    approved_at           TIMESTAMPTZ,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_provider_status CHECK (approval_status IN ('pending','approved','rejected')),
    CONSTRAINT chk_provider_type CHECK (provider_type IN (
        'hospital','clinic','pharmacy','laboratory','wellness_center',
        'ambulance','home_care','specialist','diagnostic_center'
    ))
);

CREATE INDEX idx_providers_user_id ON providers(user_id);
CREATE INDEX idx_providers_type    ON providers(provider_type);
CREATE INDEX idx_providers_status  ON providers(approval_status);
