-- ============================================================
-- InsureApp_db — Full Migration
-- Generated to match backend (server.js) exactly
-- Run order matters: users → policies → dependants
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              INT           NOT NULL AUTO_INCREMENT,
  profile_picture VARCHAR(255)  DEFAULT NULL,
  name            VARCHAR(100)  NOT NULL,
  email           VARCHAR(100)  NOT NULL,
  phone           VARCHAR(20)   NOT NULL,
  password        VARCHAR(255)  NOT NULL,
  role            VARCHAR(20)   NOT NULL DEFAULT 'User',
  status          VARCHAR(20)   NOT NULL DEFAULT 'Active',
  join_date       DATE          DEFAULT NULL,
  created_by      INT           DEFAULT NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_created_by (created_by),
  CONSTRAINT fk_users_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 2. POLICIES
--    NOTE: unique key is NAMED uq_policies_policy_number
--    so ensureTables hasIndex() check passes without error
-- ============================================================
CREATE TABLE IF NOT EXISTS policies (
  id            INT           NOT NULL AUTO_INCREMENT,
  created_by    INT           NOT NULL,
  policy_number VARCHAR(50)   NOT NULL,
  plate         VARCHAR(50)   NOT NULL,
  owner         VARCHAR(255)  NOT NULL,
  company       VARCHAR(255)  NOT NULL,
  start_date    DATE          NOT NULL,
  expiry_date   DATE          NOT NULL,
  contact       VARCHAR(50)   NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_policies_policy_number (policy_number),
  KEY idx_policies_created_by (created_by),
  CONSTRAINT fk_policies_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 3. POLICY HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS policy_history (
  id           INT       NOT NULL AUTO_INCREMENT,
  policy_id    INT       NOT NULL,
  created_by   INT       DEFAULT NULL,
  expiry_date  DATE      NOT NULL,
  renewed_date DATE      DEFAULT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_policy_id (policy_id),
  KEY idx_policy_history_created_by (created_by),
  CONSTRAINT fk_ph_policy FOREIGN KEY (policy_id)
    REFERENCES policies (id) ON DELETE CASCADE,
  CONSTRAINT fk_policy_history_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 4. FOLLOWUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS followups (
  id              INT       NOT NULL AUTO_INCREMENT,
  policy_id       INT       NOT NULL,
  created_by      INT       DEFAULT NULL,
  followup_status ENUM('confirmed','pending','missed') NOT NULL,
  notes           TEXT      DEFAULT NULL,
  followed_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY unique_policy (policy_id),
  KEY idx_followups_created_by (created_by),
  CONSTRAINT fk_fu_policy FOREIGN KEY (policy_id)
    REFERENCES policies (id) ON DELETE CASCADE,
  CONSTRAINT fk_followups_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 5. PASSWORD OTPs
-- ============================================================
CREATE TABLE IF NOT EXISTS password_otps (
  id         INT          NOT NULL AUTO_INCREMENT,
  email      VARCHAR(100) NOT NULL,
  created_by INT          DEFAULT NULL,
  otp        VARCHAR(6)   NOT NULL,
  expires_at BIGINT       NOT NULL,

  PRIMARY KEY (id),
  KEY idx_password_otps_created_by (created_by),
  CONSTRAINT fk_password_otps_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 6. SMS LOGS
--    message_id defaults to 'N/A' — matches logSMS() helper
-- ============================================================
CREATE TABLE IF NOT EXISTS sms_logs (
  id              INT           NOT NULL AUTO_INCREMENT,
  phone_number    VARCHAR(50)   NOT NULL,
  created_by      INT           DEFAULT NULL,
  message         TEXT          NOT NULL,
  message_id      VARCHAR(255)  NOT NULL DEFAULT 'N/A',
  cost            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  delivery_status VARCHAR(100)  NOT NULL DEFAULT 'pending',
  is_read         TINYINT(1)    NOT NULL DEFAULT 0,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_sms_logs_created_by (created_by),
  CONSTRAINT fk_sms_logs_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 7. SYSTEM NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id            INT          NOT NULL AUTO_INCREMENT,
  recipient_id  INT          DEFAULT NULL,
  target_role   ENUM('Admin','User','All') NOT NULL DEFAULT 'User',
  activity_type VARCHAR(50)  NOT NULL,
  title         VARCHAR(120) NOT NULL,
  message       TEXT         NOT NULL,
  policy_id     INT          DEFAULT NULL,
  is_read       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_notifications_recipient_id (recipient_id),
  KEY idx_notifications_target_role (target_role),
  KEY idx_notifications_policy_id (policy_id),
  CONSTRAINT fk_notifications_recipient_id FOREIGN KEY (recipient_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_policy_id FOREIGN KEY (policy_id)
    REFERENCES policies (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 8. ADVERTISEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS advertisements (
  id           INT          NOT NULL AUTO_INCREMENT,
  created_by   INT          DEFAULT NULL,
  company_name VARCHAR(255) NOT NULL,
  ad_type      ENUM('image','text','video') NOT NULL DEFAULT 'text',
  media_url    TEXT         NOT NULL,
  title        VARCHAR(255) DEFAULT NULL,
  cta_text     VARCHAR(100) NOT NULL DEFAULT 'Learn More',
  target_url   TEXT         DEFAULT NULL,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_advertisements_created_by (created_by),
  CONSTRAINT fk_advertisements_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 9. FAILED IMPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS failed_imports (
  id                INT           NOT NULL AUTO_INCREMENT,
  created_by        INT           DEFAULT NULL,
  import_session_id VARCHAR(36)   NOT NULL,
  row_number        INT           NOT NULL,
  policy_number     VARCHAR(50)   DEFAULT NULL,
  plate             VARCHAR(50)   DEFAULT NULL,
  owner             VARCHAR(255)  DEFAULT NULL,
  company           VARCHAR(255)  DEFAULT NULL,
  contact           VARCHAR(50)   DEFAULT NULL,
  start_date        DATE          DEFAULT NULL,
  expiry_date       DATE          DEFAULT NULL,
  reason            TEXT          NOT NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_failed_imports_created_by (created_by),
  KEY idx_failed_imports_session (import_session_id),
  CONSTRAINT fk_failed_imports_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 10. CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id           INT       NOT NULL AUTO_INCREMENT,
  sender_id    INT       NOT NULL,
  recipient_id INT       NOT NULL,
  message      TEXT      NOT NULL,
  is_read      TINYINT(1) NOT NULL DEFAULT 0,
  read_at      DATETIME  DEFAULT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_chat_messages_sender (sender_id),
  KEY idx_chat_messages_recipient (recipient_id),
  KEY idx_chat_messages_pair_time (sender_id, recipient_id, created_at),
  CONSTRAINT fk_chat_messages_sender FOREIGN KEY (sender_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_messages_recipient FOREIGN KEY (recipient_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 11. USER ACTIVITY LOGS
--    Required by logUserActivity() called on:
--    login, logout, delete user, bulk delete policies
-- ============================================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id                   INT          NOT NULL AUTO_INCREMENT,
  user_id              INT          NOT NULL,
  activity_type        VARCHAR(50)  NOT NULL,
  activity_description TEXT         NOT NULL,
  ip_address           VARCHAR(100) DEFAULT NULL,
  user_agent           TEXT         DEFAULT NULL,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_ual_user_id (user_id),
  CONSTRAINT fk_ual_user_id FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


SET FOREIGN_KEY_CHECKS = 1;
