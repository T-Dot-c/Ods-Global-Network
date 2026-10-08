-- 012_purge_seeded_admin_and_update_addresses.sql
-- Purges the default static seeded test admin credentials to eliminate deployment blocker.
-- Updates addresses constraint to permit 'customer' entity_type for polymorphic profile addresses.

-- 1. Purge default test admin
DELETE FROM admins WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@odsglobal.net');
DELETE FROM users WHERE email = 'admin@odsglobal.net';

-- 2. Extend addresses table constraint to allow customer entity_type
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS chk_address_entity_type;
ALTER TABLE addresses ADD CONSTRAINT chk_address_entity_type CHECK (entity_type IN ('customer', 'merchant', 'provider'));

-- 3. Add unique index for single primary address per customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_customer_unique ON addresses(entity_type, entity_id) WHERE entity_type = 'customer';
