-- 007_fix_negative_balances.sql
-- 1. Resets any existing negative balances to 0.00 and logs a correcting credit
--    transaction for audit purposes.
-- 2. Adds a CHECK constraint so the DB itself rejects any future negative balance writes.

-- ─── Step 1: Insert a correcting "Balance Correction" credit transaction for every
--            user whose balance is currently negative, so the audit trail shows why
--            their balance jumped to 0. ──────────────────────────────────────────

INSERT INTO transactions (user_id, amount, type, description)
SELECT
    id                          AS user_id,
    ABS(balance)                AS amount,
    'credit'                    AS type,
    CONCAT('Balance correction: removed negative balance of ₦', FORMAT(ABS(balance), 2)) AS description
FROM users
WHERE balance < 0;

-- ─── Step 2: Zero out all negative balances ────────────────────────────────────

UPDATE users
SET balance = 0.00
WHERE balance < 0;

-- ─── Step 3: Add a CHECK constraint to prevent future negative balances ────────
--    MySQL 8.0.16+ enforces CHECK constraints. On older versions (5.7, MariaDB <10.2)
--    the constraint is parsed but silently ignored — the application-level guards
--    in Transaction::create() (FOR UPDATE + balance >= amount check) remain the
--    primary enforcement layer on those older engines.

SET @dbname = DATABASE();

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME   = 'users'
      AND CONSTRAINT_NAME = 'chk_balance_non_negative'
      AND CONSTRAINT_TYPE = 'CHECK'
);

SET @preparedStatement = IF(
    @constraint_exists = 0,
    'ALTER TABLE users ADD CONSTRAINT chk_balance_non_negative CHECK (balance >= 0)',
    'SELECT 1 -- constraint already exists'
);

PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
