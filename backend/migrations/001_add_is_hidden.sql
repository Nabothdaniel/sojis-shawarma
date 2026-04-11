-- Add is_hidden column to sms_purchases table if it doesn't exist
-- 001_add_is_hidden.sql

SET @dbname = DATABASE();
SET @tablename = 'sms_purchases';
SET @columnname = 'is_hidden';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE sms_purchases ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
