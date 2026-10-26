-- Migration 021: Create Appointment Booking Engine & Provider Availability Tables
-- Batch 9: Booking & Scheduling Subsystem

-- 1. Provider Availability Rules (Weekly recurring schedule)
CREATE TABLE IF NOT EXISTS provider_availability_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    weekday INT NOT NULL CHECK (weekday >= 0 AND weekday <= 6), -- 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    time_zone VARCHAR(50) NOT NULL DEFAULT 'Africa/Addis_Ababa',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rule_times CHECK (end_time > start_time)
);

-- 2. Provider Availability Exceptions (Blackout dates or custom hours)
CREATE TABLE IF NOT EXISTS provider_availability_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT TRUE,
    start_time TIME,
    end_time TIME,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_exception_times CHECK (is_closed = TRUE OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time))
);

-- 3. Bookings Table (7-state lifecycle with hold management)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(32) UNIQUE NOT NULL,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    provider_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_payment' CHECK (
        status IN (
            'pending_payment',
            'awaiting_provider',
            'confirmed',
            'completed',
            'cancelled_by_customer',
            'cancelled_by_provider',
            'cancelled_by_admin',
            'declined',
            'no_show',
            'expired',
            'payment_conflict'
        )
    ),
    hold_expires_at TIMESTAMPTZ,
    price_amount NUMERIC(12, 2) NOT NULL CHECK (price_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    contact_phone VARCHAR(32),
    customer_note TEXT,
    service_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    cancellation_policy_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    payment_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    gift_card_id UUID REFERENCES gift_cards(id) ON DELETE SET NULL,
    refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (refund_amount >= 0),
    reschedule_count INT NOT NULL DEFAULT 0 CHECK (reschedule_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_times CHECK (end_at > start_at)
);

-- 4. Immutable Status History Table (Ledger-style audit)
CREATE TABLE IF NOT EXISTS booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Booking Outbox Table (Batch 11 notification decoupling)
CREATE TABLE IF NOT EXISTS booking_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_avail_rules_lookup ON provider_availability_rules (provider_user_id, weekday, is_active);
CREATE INDEX IF NOT EXISTS idx_avail_exceptions_lookup ON provider_availability_exceptions (provider_user_id, exception_date);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_start ON bookings (provider_user_id, start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_start ON bookings (customer_user_id, start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_service_start ON bookings (service_id, start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status_hold ON bookings (status, hold_expires_at);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings (reference);
CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON booking_status_history (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_outbox_unprocessed ON booking_outbox (processed) WHERE processed = FALSE;

-- 7. Least-Privilege Security Grants for ods_app
GRANT SELECT, INSERT, UPDATE, DELETE ON provider_availability_rules TO ods_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON provider_availability_exceptions TO ods_app;

GRANT SELECT, INSERT, UPDATE ON bookings TO ods_app;
REVOKE DELETE, TRUNCATE ON bookings FROM ods_app;

GRANT SELECT, INSERT, UPDATE ON booking_outbox TO ods_app;

-- Ledger-style append-only security for status history
GRANT SELECT, INSERT ON booking_status_history TO ods_app;
REVOKE UPDATE, DELETE, TRUNCATE ON booking_status_history FROM ods_app;
