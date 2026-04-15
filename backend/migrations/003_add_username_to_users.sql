-- Migration: Add username column and remove email usage
ALTER TABLE users ADD COLUMN username VARCHAR(100) AFTER id;
ALTER TABLE users MODIFY COLUMN name VARCHAR(255) NULL;

-- Set username to email prefix for existing users as a starting point
UPDATE users SET username = SUBSTRING_INDEX(email, '@', 1) WHERE username IS NULL;

-- Ensure username is unique
ALTER TABLE users ADD UNIQUE (username);

-- Optional cleanup once all code paths stop using email
-- UPDATE users SET username = CONCAT('user', id) WHERE username IS NULL OR username = '';
-- ALTER TABLE users DROP COLUMN email;
