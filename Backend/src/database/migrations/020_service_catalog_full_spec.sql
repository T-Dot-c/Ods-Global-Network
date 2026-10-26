-- Migration 020: Full Specification Service Catalog & Category Taxonomy
-- Batch 8: Service Catalog (Merchant & Provider Support, Media Linking, 7-State Engine, History Ledger)

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Service Categories (Two-level taxonomy: Category -> Subcategories)
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES service_categories(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed top-level categories matching official scope
INSERT INTO service_categories (id, parent_id, name, slug, sort_order) VALUES
('b1000001-0000-0000-0000-000000000001', NULL, 'Hospitals & Medical Centers', 'hospital', 1),
('b1000001-0000-0000-0000-000000000002', NULL, 'Clinics & Outpatient Care', 'clinic', 2),
('b1000001-0000-0000-0000-000000000003', NULL, 'Pharmacies & Prescription Drugs', 'pharmacy', 3),
('b1000001-0000-0000-0000-000000000004', NULL, 'Laboratories & Pathology', 'laboratory', 4),
('b1000001-0000-0000-0000-000000000005', NULL, 'Wellness, Physio & Spa', 'wellness-center', 5),
('b1000001-0000-0000-0000-000000000006', NULL, 'Ambulance & Emergency Transport', 'ambulance', 6),
('b1000001-0000-0000-0000-000000000007', NULL, 'Home Health & Mobile Care', 'home-care', 7),
('b1000001-0000-0000-0000-000000000008', NULL, 'Medical Specialists', 'specialist', 8),
('b1000001-0000-0000-0000-000000000009', NULL, 'Diagnostic Imaging & Radiology', 'diagnostic-center', 9)
ON CONFLICT (slug) DO NOTHING;

-- Seed representative subcategories
INSERT INTO service_categories (parent_id, name, slug, sort_order) VALUES
('b1000001-0000-0000-0000-000000000001', 'Inpatient General Admission', 'hospital-inpatient', 1),
('b1000001-0000-0000-0000-000000000001', 'Emergency Care', 'hospital-emergency', 2),
('b1000001-0000-0000-0000-000000000002', 'General Practitioner Consultation', 'clinic-gp', 1),
('b1000001-0000-0000-0000-000000000002', 'Dental Examination & Cleaning', 'clinic-dental', 2),
('b1000001-0000-0000-0000-000000000003', 'Chronic Medication Refill', 'pharmacy-refill', 1),
('b1000001-0000-0000-0000-000000000004', 'Comprehensive Blood Chemistry', 'lab-blood-chemistry', 1),
('b1000001-0000-0000-0000-000000000004', 'Lipid & Cardiac Panels', 'lab-lipid-cardiac', 2),
('b1000001-0000-0000-0000-000000000005', 'Physiotherapy & Rehabilitation', 'wellness-physio', 1),
('b1000001-0000-0000-0000-000000000007', 'Doctor Home Visit Consultation', 'home-care-doctor', 1),
('b1000001-0000-0000-0000-000000000007', 'Nurse Home Nursing & IV Therapy', 'home-care-nurse', 2),
('b1000001-0000-0000-0000-000000000008', 'Cardiologist Consultation', 'specialist-cardiology', 1),
('b1000001-0000-0000-0000-000000000008', 'Pediatrician Consultation', 'specialist-pediatrics', 2),
('b1000001-0000-0000-0000-000000000009', 'Ultrasound & Sonography', 'diagnostic-ultrasound', 1),
('b1000001-0000-0000-0000-000000000009', 'Echocardiogram (Echo)', 'diagnostic-echo', 2)
ON CONFLICT (slug) DO NOTHING;

-- 2. Expand Services Table Schema
ALTER TABLE services ALTER COLUMN provider_id DROP NOT NULL;
ALTER TABLE services ALTER COLUMN category DROP NOT NULL;
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_category_check;
ALTER TABLE services ALTER COLUMN delivery_type DROP NOT NULL;
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_delivery_type_check;

ALTER TABLE services 
    ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS owner_type VARCHAR(20) NOT NULL DEFAULT 'provider' CHECK (owner_type IN ('merchant', 'provider')),
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES service_categories(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS short_description VARCHAR(300),
    ADD COLUMN IF NOT EXISTS price_amount NUMERIC(12, 2) DEFAULT 0.00 CHECK (price_amount >= 0),
    ADD COLUMN IF NOT EXISTS capacity INT NOT NULL DEFAULT 1 CHECK (capacity >= 1),
    ADD COLUMN IF NOT EXISTS lead_time_hours INT NOT NULL DEFAULT 0 CHECK (lead_time_hours >= 0),
    ADD COLUMN IF NOT EXISTS location_type VARCHAR(30) NOT NULL DEFAULT 'on_site' CHECK (location_type IN ('on_site', 'at_customer', 'online')),
    ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Addis Ababa',
    ADD COLUMN IF NOT EXISTS area VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cancellation_note TEXT,
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS takedown_reason TEXT,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Drop old status check constraint and apply full 7-state lifecycle + backward compatibility
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_status_check;
ALTER TABLE services DROP CONSTRAINT IF EXISTS chk_services_status;

ALTER TABLE services ADD CONSTRAINT chk_services_status 
    CHECK (status IN ('draft', 'pending_review', 'published', 'unpublished', 'rejected', 'taken_down', 'archived', 'pending', 'approved'));

-- Backfill existing rows if any
UPDATE services s
SET owner_user_id = p.user_id,
    owner_type = 'provider'
FROM providers p
WHERE s.provider_id = p.id AND s.owner_user_id IS NULL;

UPDATE services 
SET price_amount = price 
WHERE (price_amount IS NULL OR price_amount = 0) AND price > 0;

UPDATE services 
SET status = 'published', published_at = CURRENT_TIMESTAMP 
WHERE status = 'approved';

UPDATE services 
SET status = 'pending_review' 
WHERE status = 'pending';

-- 3. Service Images Table (Reusing Batch 4 documents/uploads system)
CREATE TABLE IF NOT EXISTS service_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    upload_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    image_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_cover BOOLEAN NOT NULL DEFAULT FALSE,
    alt_text VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_service_upload UNIQUE (service_id, upload_id)
);

-- 4. Immutable Status History Table (Ledger-style audit)
CREATE TABLE IF NOT EXISTS service_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_service_categories_slug ON service_categories(slug);
CREATE INDEX IF NOT EXISTS idx_service_categories_parent ON service_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_services_owner_user ON services(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_services_owner_type ON services(owner_type);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_location_type ON services(location_type);
CREATE INDEX IF NOT EXISTS idx_services_published_at ON services(published_at);
CREATE INDEX IF NOT EXISTS idx_services_tags ON services USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_service_images_service ON service_images(service_id);
CREATE INDEX IF NOT EXISTS idx_service_status_history_service ON service_status_history(service_id);
CREATE INDEX IF NOT EXISTS idx_services_title_trgm ON services USING gin (title gin_trgm_ops);

-- 6. Permissions / Grants (Least-privilege ods_app)
GRANT SELECT, INSERT, UPDATE ON service_categories, services TO ods_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON service_images TO ods_app;
GRANT SELECT, INSERT ON service_status_history TO ods_app;
REVOKE UPDATE, DELETE, TRUNCATE ON service_status_history FROM ods_app;
