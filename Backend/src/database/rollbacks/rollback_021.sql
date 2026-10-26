-- Rollback 021: Drop Appointment Booking & Provider Availability Tables

DROP TABLE IF EXISTS booking_outbox CASCADE;
DROP TABLE IF EXISTS booking_status_history CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS provider_availability_exceptions CASCADE;
DROP TABLE IF EXISTS provider_availability_rules CASCADE;
