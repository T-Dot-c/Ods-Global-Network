-- Migration 017: Create gift_cards, gift_card_redemptions, and customer_wallets tables
-- Batch 7: Gifting & Vouchers subsystem

CREATE TABLE IF NOT EXISTS gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    code_hash VARCHAR(64) UNIQUE NOT NULL,
    initial_amount NUMERIC(12, 2) NOT NULL CHECK (initial_amount > 0),
    balance NUMERIC(12, 2) NOT NULL CHECK (balance >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    gift_type VARCHAR(20) NOT NULL DEFAULT 'monetary' CHECK (gift_type IN ('monetary', 'service')),
    package_type VARCHAR(20) NOT NULL DEFAULT 'custom' CHECK (package_type IN ('custom', 'basic', 'vip')),
    occasion VARCHAR(50) NOT NULL DEFAULT 'general',
    service_title VARCHAR(128),
    service_category VARCHAR(64),
    service_provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'delivered', 'expired', 'cancelled')),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(32),
    recipient_name VARCHAR(128),
    personal_message TEXT,
    expiry_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    redeemed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS gift_card_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    balance_after NUMERIC(12, 2) NOT NULL CHECK (balance_after >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performant lookup
CREATE INDEX IF NOT EXISTS idx_gift_cards_code_hash ON gift_cards(code_hash);
CREATE INDEX IF NOT EXISTS idx_gift_cards_sender_id ON gift_cards(sender_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient_id ON gift_cards(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_card_redemptions_user_id ON gift_card_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_redemptions_gift_card_id ON gift_card_redemptions(gift_card_id);

-- Least-privilege application grants (DELETE explicitly denied)
GRANT SELECT, INSERT, UPDATE ON gift_cards TO ods_app;
GRANT SELECT, INSERT, UPDATE ON gift_card_redemptions TO ods_app;
GRANT SELECT, INSERT, UPDATE ON customer_wallets TO ods_app;
