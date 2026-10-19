-- 016_create_transactions_table.sql
-- Establishes the transactions table for payment processing, Chapa reference tracking, and financial history.

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tx_ref VARCHAR(64) UNIQUE NOT NULL,
    chapa_reference VARCHAR(128),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_method VARCHAR(30) NOT NULL DEFAULT 'chapa',
    purpose VARCHAR(50) NOT NULL DEFAULT 'general_payment',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_ref ON transactions(tx_ref);
CREATE INDEX IF NOT EXISTS idx_transactions_status_pending ON transactions(status) WHERE status = 'pending';

-- Grant least-privilege access to ods_app role (DELETE strictly denied)
GRANT SELECT, INSERT, UPDATE ON transactions TO ods_app;
