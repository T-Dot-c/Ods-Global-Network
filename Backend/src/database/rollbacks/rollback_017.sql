-- Rollback 017: Drop gift_cards, redemptions, and customer_wallets
DROP TABLE IF EXISTS gift_card_redemptions CASCADE;
DROP TABLE IF EXISTS customer_wallets CASCADE;
DROP TABLE IF EXISTS gift_cards CASCADE;
