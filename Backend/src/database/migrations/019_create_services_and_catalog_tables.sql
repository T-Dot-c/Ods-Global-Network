-- Migration 019: Create services and service_reviews tables
-- Batch 8: Service Catalog & Provider Directory

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'hospital',
        'clinic',
        'pharmacy',
        'laboratory',
        'wellness_center',
        'ambulance',
        'home_care',
        'specialist',
        'diagnostic_center'
    )),
    subcategory VARCHAR(100),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    delivery_type VARCHAR(20) NOT NULL DEFAULT 'in_clinic' CHECK (delivery_type IN ('in_clinic', 'home_visit', 'virtual', 'diagnostic')),
    image_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_service_user_review UNIQUE (service_id, user_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_price ON services(price);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_service_reviews_service ON service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_user ON service_reviews(user_id);

-- Least-privilege application grants (DELETE intentionally omitted for ods_app)
GRANT SELECT, INSERT, UPDATE ON services TO ods_app;
GRANT SELECT, INSERT, UPDATE ON service_reviews TO ods_app;
