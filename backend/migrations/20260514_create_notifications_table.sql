-- Migration: Create notifications table for system notifications
-- This table stores system notifications for admins and users.

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_id INT DEFAULT NULL,
  target_role ENUM('Admin','User','All') NOT NULL DEFAULT 'User',
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  policy_id INT DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_notifications_recipient_id (recipient_id),
  KEY idx_notifications_target_role (target_role),
  KEY idx_notifications_policy_id (policy_id),
  CONSTRAINT fk_notifications_recipient_id FOREIGN KEY (recipient_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_policy_id FOREIGN KEY (policy_id)
    REFERENCES policies (id) ON DELETE SET NULL
) ENGINE=InnoDB;
