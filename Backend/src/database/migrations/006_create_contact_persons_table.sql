-- 006_create_contact_persons_table.sql
-- Shared/polymorphic table reused by merchants and providers.

CREATE TABLE contact_persons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(20) NOT NULL,
    entity_id       UUID NOT NULL,

    full_name       VARCHAR(150) NOT NULL,
    position_role   VARCHAR(100),
    email           VARCHAR(255),
    phone           VARCHAR(20),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_contact_entity_type CHECK (entity_type IN ('merchant','provider'))
);

CREATE INDEX idx_contact_persons_entity ON contact_persons(entity_type, entity_id);
