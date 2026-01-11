-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: InsureApp
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `expired_policies`
--

DROP TABLE IF EXISTS `expired_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expired_policies`
--

LOCK TABLES `expired_policies` WRITE;
/*!40000 ALTER TABLE `expired_policies` DISABLE KEYS */;
/*!40000 ALTER TABLE `expired_policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expiredreport`
--

DROP TABLE IF EXISTS `expiredreport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expiredreport`
--

LOCK TABLES `expiredreport` WRITE;
/*!40000 ALTER TABLE `expiredreport` DISABLE KEYS */;
INSERT INTO `expiredreport` VALUES (85,193,'RAD234B','heroic','RADIANT','2026-01-02','2026-01-06','0798367330',0,'2026-01-02 09:46:22','2026-01-02 09:46:22'),(86,194,'RAD234B','heroic','RADIANT','2026-01-02','2026-01-02','0798367330',0,'2026-01-02 09:54:07','2026-01-02 09:54:07'),(87,195,'RAD234p','AIME','RADIANT','2026-01-02','2026-01-21','0798367330',0,'2026-01-02 09:55:26','2026-01-02 09:55:26'),(88,196,'RAD234i','heroic','RADIANT','2026-01-02','2026-01-02','0798367330',0,'2026-01-02 10:11:48','2026-01-02 10:11:48'),(89,197,'RAD234i','heroic','RADIANT','2026-01-02','2026-01-02','0798367330',0,'2026-01-02 15:04:40','2026-01-02 15:04:40'),(90,199,'RAD234t','heroic','SONARWA','2026-01-03','2026-01-21','0798367333',0,'2026-01-03 08:42:08','2026-01-03 08:42:08'),(91,200,'RAD234z','heroic','RADIANT','2026-01-03','2026-01-05','0798345678',0,'2026-01-03 10:59:07','2026-01-03 10:59:07'),(92,201,'RAD234p','heroic','RADIANT','2026-01-03','2026-01-03','0789876543',0,'2026-01-03 12:50:10','2026-01-03 12:50:10'),(93,202,'RAD234i','heroic','RADIANT','2026-01-03','2026-01-12','0786543298',0,'2026-01-03 15:46:17','2026-01-03 15:46:17'),(94,203,'RAD234p','AIME','RADIANT','2026-01-10','2026-01-22','0798456784',0,'2026-01-10 13:12:13','2026-01-10 13:12:13');
/*!40000 ALTER TABLE `expiredreport` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `followups`
--

DROP TABLE IF EXISTS `followups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `followups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `policy_id` int(11) NOT NULL,
  `followup_status` enum('confirmed','pending','missed') NOT NULL,
  `notes` text DEFAULT NULL,
  `followed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_policy` (`policy_id`),
  KEY `idx_followup_policy` (`policy_id`),
  KEY `idx_followup_status` (`followup_status`),
  CONSTRAINT `followups_ibfk_1` FOREIGN KEY (`policy_id`) REFERENCES `policies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `followups`
--

LOCK TABLES `followups` WRITE;
/*!40000 ALTER TABLE `followups` DISABLE KEYS */;
/*!40000 ALTER TABLE `followups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_otps`
--

DROP TABLE IF EXISTS `password_otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_otps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) DEFAULT NULL,
  `otp` varchar(6) DEFAULT NULL,
  `expires_at` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_otps`
--

LOCK TABLES `password_otps` WRITE;
/*!40000 ALTER TABLE `password_otps` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `policies`
--

DROP TABLE IF EXISTS `policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  UNIQUE KEY `plate` (`plate`),
  UNIQUE KEY `contact` (`contact`),
  KEY `idx_contact` (`contact`),
  KEY `idx_expiry_date` (`expiry_date`),
  KEY `idx_company` (`company`)
) ENGINE=InnoDB AUTO_INCREMENT=204 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `policies`
--

LOCK TABLES `policies` WRITE;
/*!40000 ALTER TABLE `policies` DISABLE KEYS */;
INSERT INTO `policies` VALUES (199,'RAD234a','heroic','SONARWA','2026-01-03','2026-01-21','0798367333','2026-01-03 08:42:08','2026-01-10 14:33:11',0),(202,'RAD234i','heroic','RADIANT','2026-01-03','2026-01-03','0786543298','2026-01-03 15:46:17','2026-01-03 16:13:29',0),(203,'RAD234p','AIME','RADIANT','2026-01-10','2026-01-22','0798456784','2026-01-10 13:12:13','2026-01-10 13:12:13',0);
/*!40000 ALTER TABLE `policies` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_policies_after_insert
AFTER INSERT ON policies
FOR EACH ROW
BEGIN
  INSERT INTO expiredreport (
    policy_id, plate, owner, company, start_date, expiry_date, contact, days_overdue, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.plate, NEW.owner, NEW.company, NEW.start_date, NEW.expiry_date, NEW.contact, GREATEST(DATEDIFF(CURDATE(), NEW.expiry_date), 0), NOW(), NOW()
  )
  ON DUPLICATE KEY UPDATE
    plate = VALUES(plate),
    owner = VALUES(owner),
    company = VALUES(company),
    start_date = VALUES(start_date),
    expiry_date = VALUES(expiry_date),
    contact = VALUES(contact),
    days_overdue = VALUES(days_overdue),
    updated_at = NOW();
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `policy_history`
--

DROP TABLE IF EXISTS `policy_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `policy_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `policy_id` int(11) NOT NULL,
  `expiry_date` date NOT NULL,
  `renewed_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_policy_id` (`policy_id`),
  KEY `idx_expiry` (`expiry_date`),
  KEY `idx_renewed` (`renewed_date`),
  CONSTRAINT `policy_history_ibfk_1` FOREIGN KEY (`policy_id`) REFERENCES `policies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `policy_history`
--

LOCK TABLES `policy_history` WRITE;
/*!40000 ALTER TABLE `policy_history` DISABLE KEYS */;
INSERT INTO `policy_history` VALUES (55,202,'2026-01-12','2026-01-03','2026-01-03 16:13:29','2026-01-03 16:13:29'),(56,202,'2026-01-03',NULL,'2026-01-04 16:53:27','2026-01-04 16:53:27'),(57,199,'2026-01-21','2026-01-10','2026-01-10 14:32:59','2026-01-10 14:32:59'),(58,199,'2026-01-21','2026-01-10','2026-01-10 14:33:05','2026-01-10 14:33:05'),(59,199,'2026-01-21','2026-01-10','2026-01-10 14:33:11','2026-01-10 14:33:11');
/*!40000 ALTER TABLE `policy_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('eYefdr78NTUG0jnveeOb-P7ejlky9Qfw',1768086606,'{\"cookie\":{\"originalMaxAge\":28800000,\"expires\":\"2026-01-10T21:57:17.396Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":73,\"userRole\":\"Admin\"}');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_logs`
--

DROP TABLE IF EXISTS `sms_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sms_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `phone_number` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `message_id` varchar(100) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT 0.00,
  `delivery_status` varchar(50) DEFAULT 'pending',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sms_created` (`created_at`),
  KEY `idx_sms_read` (`is_read`)
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_logs`
--

LOCK TABLES `sms_logs` WRITE;
/*!40000 ALTER TABLE `sms_logs` DISABLE KEYS */;
INSERT INTO `sms_logs` VALUES (151,'+250798367330','Your insurance policy for RAD234i has been renewed. New period: 2026-01-02 to 2026-01-02.','ATXid_91014ebabca5a1e3d4ce9e666e34772e',14.00,'Success',0,'2026-01-02 15:03:23'),(152,'+250798367330','Your insurance policy for RAD234i runs from 2026-01-02 to 2026-01-02.','ATXid_5fee6b2e501f876c19cc49f58e0218e7',14.00,'Success',0,'2026-01-02 15:04:43'),(153,'+250798367330','Your insurance policy for RAD234i has been renewed. New period: 2026-01-02 to 2026-01-15.','ATXid_74ddd050ea1ee4b387ec68c218dab004',14.00,'Success',0,'2026-01-02 17:06:46');
/*!40000 ALTER TABLE `sms_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  UNIQUE KEY `unique_phone` (`phone`),
  UNIQUE KEY `phone` (`phone`),
  KEY `idx_email` (`email`),
  KEY `idx_phone` (`phone`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (73,'/uploads/profile_1766248591882.jfif','heroic','himbazasemu23@gmail.com','0798367330','$2b$10$RTqWJjQh41WcoQS3PJan5.rMj4ZK2dlGlFPjtyZ.6N.P4GB220K42','Admin','Active','2025-12-19','2025-12-19 18:19:57','2025-12-24 11:55:15'),(74,'/uploads/profile_1767370703397.jfif','roic','himbazasemu03@gmail.com','0798367332','$2b$10$wnjG6LDG58LFYGEQWpHzCOKEZvN/MYCDjw5yKMqOVjVqh7X3omc36','Manager','Inactive','2025-12-19','2025-12-19 19:04:43','2026-01-10 14:32:38'),(76,NULL,'Emmy','aimemerveilleux@gmail.com','0798367339','$2b$10$5.ksJWe8ABG4qIHUddm4r.aq6Dy9.0vaeUiEktrRQk3aqbZyJrsY6','Manager','Active','2026-01-03','2026-01-03 09:13:25','2026-01-10 13:15:27'),(77,NULL,'iranzi12345@gmail.com','iranzi12345@gmail.com','0798345330','$2b$10$qecTC3UlrTlI84oiKX016uzpN0X40gU7fW25LimDfqWjKDZGqKVQe','Manager','Active','2026-01-10','2026-01-10 11:43:17','2026-01-10 14:32:27');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER users_set_join_date
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.join_date IS NULL THEN
    SET NEW.join_date = DATE(NOW());
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-10  7:10:33
