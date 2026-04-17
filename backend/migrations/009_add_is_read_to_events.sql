-- 009_add_is_read_to_events.sql
-- Adds persistence for unread states in notifications

ALTER TABLE system_events 
ADD COLUMN is_read TINYINT(1) DEFAULT 0 AFTER is_delivered;

CREATE INDEX idx_user_read ON system_events (user_id, is_read);
