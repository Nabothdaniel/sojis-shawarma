-- Migration: Create Client Admin User
-- Default Credentials: bamzy_client / password
-- IMPORTANT: Change password immediately after first login

INSERT INTO users (username, name, phone, password, role, balance)
VALUES ('bamzy_client', 'Client Admin', '08000000000', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 0.00)
ON DUPLICATE KEY UPDATE role = 'admin';
