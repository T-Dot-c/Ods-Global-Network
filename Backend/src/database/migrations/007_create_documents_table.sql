-- 007_create_documents_table.sql
-- Shared/polymorphic table for uploaded documents (Merchant/Provider verification docs).

CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(20) NOT NULL,
    entity_id       UUID NOT NULL,

    document_type   VARCHAR(60) NOT NULL,
    file_url        VARCHAR(500) NOT NULL,
    file_name       VARCHAR(255),
    mime_type       VARCHAR(100),

    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,

    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_document_entity_type CHECK (entity_type IN ('merchant','provider')),
    CONSTRAINT chk_document_status CHECK (status IN ('pending','verified','rejected'))
);

CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
