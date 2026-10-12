-- 014_onboarding_and_shared_documents.sql
-- Description: Extends documents for shared upload service (purpose, file_size, storage_path, attachment state).
--              Extends merchants and providers with reviewer tracking and rejection reasons.
--              Extends partners with document_id attachment reference.
--              Applies guarded least-privilege grants for ods_app with append-only audit_logs.

-- 1. Extend documents table
ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS purpose VARCHAR(60) NOT NULL DEFAULT 'kyc_license',
    ADD COLUMN IF NOT EXISTS file_size INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS storage_path VARCHAR(500) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS is_attached BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Relax entity_id to nullable for unattached anonymous files
ALTER TABLE documents ALTER COLUMN entity_id DROP NOT NULL;

-- Update entity_type check constraint
ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_document_entity_type;
ALTER TABLE documents ADD CONSTRAINT chk_document_entity_type
    CHECK (entity_type IN ('merchant', 'provider', 'partner', 'unattached'));

-- Attachment state constraint: attached must have entity_id; unattached must have expires_at
ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_document_attachment_state;
ALTER TABLE documents ADD CONSTRAINT chk_document_attachment_state
    CHECK ((is_attached = TRUE AND entity_id IS NOT NULL) OR (is_attached = FALSE AND expires_at IS NOT NULL));

-- Index for sweeper queries and anonymous quota calculations
CREATE INDEX IF NOT EXISTS idx_documents_unattached_expiry
    ON documents(is_attached, expires_at)
    WHERE is_attached = FALSE;

-- 2. Extend merchants table with rejection and reviewer fields
ALTER TABLE merchants
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 3. Extend providers table with rejection and reviewer fields
ALTER TABLE providers
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 4. Extend partners table with document reference
ALTER TABLE partners
    ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_partners_document_id ON partners(document_id);

-- 5. Role-Guarded Grants for ods_app user (audit_logs is strictly SELECT, INSERT)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'ods_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO ods_app;
    GRANT SELECT, INSERT, UPDATE ON merchants, providers, partners TO ods_app;
    GRANT SELECT, INSERT ON audit_logs TO ods_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ods_app;
  END IF;
END
$$;
