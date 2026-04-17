-- 005_add_transaction_index.sql
-- Add indexes to transactions for faster filtering and pagination

SET @dbname = DATABASE();
SET @tablename = 'transactions';

-- Index on user_id for fast user lookups
SET @indexname = 'idx_user_created';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND INDEX_NAME = @indexname) > 0,
  'SELECT 1',
  'CREATE INDEX idx_user_created ON transactions(user_id, created_at DESC)'
));

PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index on type for filtering credits (top-ups)
SET @indexname = 'idx_type';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND INDEX_NAME = @indexname) > 0,
  'SELECT 1',
  'CREATE INDEX idx_type ON transactions(type, created_at DESC)'
));

PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
