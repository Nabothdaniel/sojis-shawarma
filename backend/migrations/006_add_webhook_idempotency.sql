-- 006_add_webhook_idempotency.sql
-- Adds an external_ref column to transactions for atomic webhook idempotency.
-- A UNIQUE constraint on external_ref ensures that even if two webhook
-- deliveries arrive simultaneously, only one INSERT will succeed (the other
-- will get a duplicate-key error that we catch and treat as "already done").

SET @dbname = DATABASE();

-- Add external_ref column if it doesn't already exist
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME   = 'transactions'
      AND COLUMN_NAME  = 'external_ref'
);

SET @preparedStatement = IF(
    @col_exists = 0,
    'ALTER TABLE transactions ADD COLUMN external_ref VARCHAR(255) NULL UNIQUE AFTER description',
    'SELECT 1'
);
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
