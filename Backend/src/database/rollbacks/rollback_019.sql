-- Rollback Migration 019: Drop services and service_reviews tables
-- Batch 8: Service Catalog & Provider Directory

DROP TABLE IF EXISTS service_reviews CASCADE;
DROP TABLE IF EXISTS services CASCADE;
