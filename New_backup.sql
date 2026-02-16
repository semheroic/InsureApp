-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB
-- Database: InsureApp
-- Triggers REMOVED for cPanel compatibility

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table: advertisements
-- ----------------------------
DROP TABLE IF EXISTS `advertisements`;
CREATE TABLE `advertisements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL,
  `ad_type` varchar(50) DEFAULT 'image',
  `media_url` text NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `cta_text` varchar(50) DEFAULT 'Learn More',
  `target_url` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `advertisements` VALUES
(5,'postermywall','image','https://d1csarkz8obe9u.cloudfront.net/posterpreviews/professional-auto-motor-vehicle-car-insurance-design-template-281c21cfc1cf46694004db594a0dda2e_screen.jpg?ts=1738314139','Professional Auto Motor vehicle car Insurance Covers offer deals online advertisement flyer template','Learn More','https://www.postermywall.com/',1,'2026-01-18 12:56:26'),
(6,'Car creative design ideas by Roku®','video','/uploads/profile_1768827323392.mp4','Car creative design ideas ','Learn More','https://www.pinterest.com/pin/291256300921616690/',1,'2026-01-19 12:55:23'),
(7,'Toyota','video','/uploads/profile_1768828341877.mp4','Drive Toyota','Learn More','https://www.toyotarwanda.com/',1,'2026-01-19 13:12:21');

-- ----------------------------
-- Table: expired_policies
-- ----------------------------
DROP TABLE IF EXISTS `expired_policies`;
CREATE TABLE `expired_policies` (
  `id` int(11) NOT NULL,
  `plate` varchar(50) DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `contact` varchar(50) DEFAULT NULL,
  `days_remaining` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table: expiredreport
-- ----------------------------
DROP TABLE IF EXISTS `expiredreport`;
CREATE TABLE `expiredreport` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `policy_id` int(11) DEFAULT NULL,
  `plate` varchar(50) DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `contact` varchar(50) DEFAULT NULL,
  `days_overdue` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_policy` (`policy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table: policies
-- ----------------------------
DROP TABLE IF EXISTS `policies`;
CREATE TABLE `policies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plate` varchar(20) NOT NULL,
  `owner` varchar(100) NOT NULL,
  `company` varchar(50) NOT NULL,
  `start_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `contact` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_approved` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `plate` (`plate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `policies`
VALUES (209,'RAD234t','heroic','SONARWA','2026-01-19','2026-01-19','0798367330','2026-01-19 14:38:54','2026-01-19 14:38:54',0);

-- ----------------------------
-- Table: followups
-- ----------------------------
DROP TABLE IF EXISTS `followups`;
CREATE TABLE `followups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `policy_id` int(11) NOT NULL,
  `followup_status` enum('confirmed','pending','missed') NOT NULL,
  `notes` text DEFAULT NULL,
  `followed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_policy` (`policy_id`),
  CONSTRAINT `followups_ibfk_1`
    FOREIGN KEY (`policy_id`) REFERENCES `policies` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table: users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_picture` varchar(255) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Admin','Manager','User') NOT NULL DEFAULT 'User',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Inactive',
  `join_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` VALUES
(73,'/uploads/profile_1766248591882.jfif','heroic','himbazasemu23@gmail.com','0798367330','$2b$10$RTqWJjQh41WcoQS3PJan5.rMj4ZK2dlGlFPjtyZ.6N.P4GB220K42','Admin','Active','2025-12-19','2025-12-19 18:19:57','2026-01-11 08:43:39');

SET FOREIGN_KEY_CHECKS=1;
