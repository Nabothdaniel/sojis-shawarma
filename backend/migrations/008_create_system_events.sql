-- 008_create_system_events.sql
-- Creates the system_events table for SSE notifications if it doesn't exist

CREATE TABLE IF NOT EXISTS system_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- e.g., 'balance_updated', 'notification', 'otp_received'
    payload TEXT, -- JSON data
    is_delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_delivered (user_id, is_delivered)
);
