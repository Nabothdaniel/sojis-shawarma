-- Admin Settings Migration

CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default markup settings
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('price_markup_multiplier', '1.5');
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('usd_to_ngn_rate', '1600');
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('admin_email_notifications', 'admin@bamzysms.com');
