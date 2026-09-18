-- 005_create_addresses_table.sql
-- Shared/polymorphic table reused by merchants and providers.
-- entity_id is NOT a DB-level foreign key (can point to merchants.id or providers.id) -
-- integrity is enforced at the application layer based on entity_type.

CREATE TABLE addresses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(20) NOT NULL,
    entity_id       UUID NOT NULL,

    country         VARCHAR(100),
    region_state    VARCHAR(100),
    city            VARCHAR(100),
    postal_code     VARCHAR(20),
    address_line    VARCHAR(255),
    branch_code     VARCHAR(50),
    gps_lat         NUMERIC(9,6),
    gps_lng         NUMERIC(9,6),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_address_entity_type CHECK (entity_type IN ('merchant','provider'))
);

CREATE INDEX idx_addresses_entity ON addresses(entity_type, entity_id);
