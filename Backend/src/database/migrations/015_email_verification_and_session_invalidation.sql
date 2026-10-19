-- 1. Guarded grandfather UPDATE: runs ONLY when adding token_version for the first time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'token_version'
  ) THEN
    UPDATE users 
    SET is_email_verified = TRUE 
    WHERE is_email_verified = FALSE;
  END IF;
END $$;

-- 2. Add token_version column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 1;

-- 3. Indexes for token lookups and session validation
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_token_version ON users(id, token_version);

-- 4. Explicit ods_app grants:
GRANT SELECT, UPDATE(token_version) ON users TO ods_app;
