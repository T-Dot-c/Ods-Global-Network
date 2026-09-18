-- 009_seed_admin.sql
-- Seeds a single test Admin account for Task 01 DB<->Frontend wiring verification.
-- Email and password are intentionally identical, plain test values, per project decision.
-- Password is still bcrypt-hashed before storage (baseline hygiene, not a security demo).
--
-- Password:  admin@odsglobal.net
-- bcrypt hash generated with 10 rounds via bcryptjs:
--   node -e "const b=require('bcryptjs'); console.log(b.hashSync('admin@odsglobal.net', 10))"

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO users (full_name, email, password_hash, role, is_email_verified, is_active)
    VALUES (
        'System Administrator',
        'admin@odsglobal.net',
        '$2b$10$m3nZNi8LYKFPoDhw6QJlVu8qvcpvuuN6y3tn5fA1JCpNZ1jXa9XWi',
        'admin',
        TRUE,
        TRUE
    )
    RETURNING id INTO new_user_id;

    INSERT INTO admins (user_id, admin_level, permissions)
    VALUES (new_user_id, 'super_admin', '{}'::jsonb);
END $$;
