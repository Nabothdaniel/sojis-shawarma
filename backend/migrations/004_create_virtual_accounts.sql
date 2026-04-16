-- Migration: Create virtual_accounts table for PaymentPoint integration
-- Each user gets one or more dedicated bank accounts via PaymentPoint API.

CREATE TABLE IF NOT EXISTS virtual_accounts (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id              INT UNSIGNED     NOT NULL,
    bank_code            VARCHAR(20)      NOT NULL,
    account_number       VARCHAR(30)      NOT NULL,
    account_name         VARCHAR(200)     NOT NULL DEFAULT '',
    bank_name            VARCHAR(100)     NOT NULL DEFAULT '',
    reserved_account_id  VARCHAR(100)     NOT NULL DEFAULT '',
    provider_customer_id VARCHAR(100)     NOT NULL DEFAULT '',
    is_active            TINYINT(1)       NOT NULL DEFAULT 1,
    created_at           TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_account_number (account_number),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
