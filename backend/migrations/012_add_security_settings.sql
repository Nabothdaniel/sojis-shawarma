-- Add security settings to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_key_saved BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20) NULL;
