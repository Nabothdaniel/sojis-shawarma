-- Add recovery_key column to users table
-- This allows users to reset their password without email
-- The key will be stored as a hashed value for security, but the raw key is shown to the user once.

ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_key VARCHAR(255) NULL AFTER transaction_pin;
