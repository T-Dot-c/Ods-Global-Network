-- Migration 018: Enhance gift card states and add delivery scheduling
-- Batch 7: Gifting full compliance specification

-- 1. Update status check constraint to include 'pending_payment' and 'refunded'
ALTER TABLE gift_cards DROP CONSTRAINT IF EXISTS gift_cards_status_check;

ALTER TABLE gift_cards ADD CONSTRAINT gift_cards_status_check 
    CHECK (status IN ('pending_payment', 'active', 'redeemed', 'delivered', 'expired', 'cancelled', 'refunded'));

-- 2. Add scheduled_delivery_date column for delayed gift delivery (e.g. birthdays, holidays)
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS scheduled_delivery_date TIMESTAMPTZ;

-- 3. Index for performant scheduled sweeper lookup
CREATE INDEX IF NOT EXISTS idx_gift_cards_scheduled_delivery 
    ON gift_cards(scheduled_delivery_date) 
    WHERE status = 'active' AND scheduled_delivery_date IS NOT NULL;

-- 4. Re-assert least-privilege ods_app grants
GRANT SELECT, INSERT, UPDATE ON gift_cards TO ods_app;
