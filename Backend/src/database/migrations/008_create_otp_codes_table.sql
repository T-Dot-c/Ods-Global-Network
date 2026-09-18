-- 008_create_otp_codes_table.sql
-- Customer SMS phone verification codes.

CREATE TABLE otp_codes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash    VARCHAR(255) NOT NULL,
    purpose      VARCHAR(30)  NOT NULL DEFAULT 'phone_verification',
    expires_at   TIMESTAMPTZ  NOT NULL,
    verified_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_user_id ON otp_codes(user_id);
