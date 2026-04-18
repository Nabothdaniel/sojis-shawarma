-- Fix email constraint to allow username-based auth without emails
ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL;
