-- Rollback Migration 020: Drop service_status_history, service_images, and service_categories
-- Batch 8: Full Specification Service Catalog

DROP TABLE IF EXISTS service_status_history CASCADE;
DROP TABLE IF EXISTS service_images CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;

ALTER TABLE services 
    DROP COLUMN IF EXISTS owner_user_id,
    DROP COLUMN IF EXISTS owner_type,
    DROP COLUMN IF EXISTS category_id,
    DROP COLUMN IF EXISTS short_description,
    DROP COLUMN IF EXISTS price_amount,
    DROP COLUMN IF EXISTS capacity,
    DROP COLUMN IF EXISTS lead_time_hours,
    DROP COLUMN IF EXISTS location_type,
    DROP COLUMN IF EXISTS city,
    DROP COLUMN IF EXISTS area,
    DROP COLUMN IF EXISTS cancellation_note,
    DROP COLUMN IF EXISTS tags,
    DROP COLUMN IF EXISTS takedown_reason,
    DROP COLUMN IF EXISTS published_at;
