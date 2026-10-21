-- Rollback 018: Revert status check constraint and scheduled_delivery_date

DROP INDEX IF EXISTS idx_gift_cards_scheduled_delivery;

ALTER TABLE gift_cards DROP COLUMN IF EXISTS scheduled_delivery_date;

ALTER TABLE gift_cards DROP CONSTRAINT IF EXISTS gift_cards_status_check;

ALTER TABLE gift_cards ADD CONSTRAINT gift_cards_status_check 
    CHECK (status IN ('active', 'redeemed', 'delivered', 'expired', 'cancelled'));
