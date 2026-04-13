-- Add country_id column to service_overrides table if it doesn't exist
-- 002_add_country_id_to_overrides.sql

SET @dbname = DATABASE();
SET @tablename = 'service_overrides';
SET @columnname = 'country_id';

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE service_overrides ADD COLUMN country_id INT DEFAULT 0 AFTER service_code'
));

PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for performance
SET @indexname = 'idx_country_service';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND INDEX_NAME = @indexname) > 0,
  'SELECT 1',
  'CREATE INDEX idx_country_service ON service_overrides(country_id, service_code)'
));

PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
