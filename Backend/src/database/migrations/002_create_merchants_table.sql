-- 002_create_merchants_table.sql
-- Merchant role extension table. Includes Organization accounts via business_type = 'organization'.

CREATE TABLE merchants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    business_name       VARCHAR(200) NOT NULL,
    business_type       VARCHAR(100),   -- e.g. 'retailer','pharmacy_supplier','equipment_vendor','organization'
    category            VARCHAR(100),
    business_phone      VARCHAR(20),
    business_email      VARCHAR(255),
    website              VARCHAR(255),
    description          TEXT,

    approval_status     VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by         UUID REFERENCES users(id),
    approved_at         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_merchant_status CHECK (approval_status IN ('pending','approved','rejected'))
);

CREATE INDEX idx_merchants_user_id ON merchants(user_id);
CREATE INDEX idx_merchants_status  ON merchants(approval_status);
