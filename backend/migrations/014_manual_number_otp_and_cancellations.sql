ALTER TABLE manual_numbers
    ADD COLUMN otp_code_encrypted TEXT NULL AFTER notes;

CREATE TABLE IF NOT EXISTS manual_number_cancellation_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    manual_number_id INT NOT NULL,
    user_id INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    admin_note VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_manual_cancel_status (status, created_at),
    KEY idx_manual_cancel_user (user_id),
    CONSTRAINT fk_manual_cancel_number FOREIGN KEY (manual_number_id) REFERENCES manual_numbers(id),
    CONSTRAINT fk_manual_cancel_user FOREIGN KEY (user_id) REFERENCES users(id)
);
