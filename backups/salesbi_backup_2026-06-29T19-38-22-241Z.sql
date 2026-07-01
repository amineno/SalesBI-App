-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: salesbi_db
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `table_affected` varchar(50) DEFAULT NULL,
  `data_snapshot` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_audit_logs_action` (`action`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'CREATE_PRODUCT','products','{\"id\": 1, \"sku\": \"test001\", \"name\": \"test\"}',NULL,'2026-06-27 11:34:13'),(2,1,'UPDATE_PRODUCT','products','{\"id\": \"1\", \"sku\": \"test001\", \"name\": \"test\"}',NULL,'2026-06-27 11:34:34'),(3,1,'CREATE_CUSTOMER','customers','{\"id\": 1, \"email\": \"nouiouiamine20@gmail.com\", \"full_name\": \"Mohamed Amine nouioui\"}',NULL,'2026-06-27 11:35:43'),(4,1,'CREATE_ORDER','orders','{\"id\": 1, \"customer_id\": \"1\", \"totalAmount\": 10000}',NULL,'2026-06-27 11:36:22'),(5,1,'CREATE_PRODUCT','products','{\"id\": 2, \"sku\": \"test002\", \"name\": \"test\"}',NULL,'2026-06-27 12:52:00'),(6,1,'CREATE_ORDER','orders','{\"id\": 2, \"customer_id\": \"1\", \"totalAmount\": 1466652}',NULL,'2026-06-27 12:52:37'),(7,1,'CREATE_PRODUCT','products','{\"id\": 3, \"sku\": \"eya001\", \"name\": \"eya\"}',NULL,'2026-06-27 12:55:12'),(8,1,'CREATE_ORDER','orders','{\"id\": 3, \"customer_id\": \"1\", \"totalAmount\": 1000}',NULL,'2026-06-27 12:55:53'),(9,2,'CREATE_ORDER','orders','{\"id\": 4, \"customer_id\": \"1\", \"totalAmount\": 500}',NULL,'2026-06-27 13:13:29'),(10,1,'UPDATE_PROFILE','users','{\"full_name\": \"tets\"}','::1','2026-06-29 18:06:51'),(11,1,'CREATE_PRODUCT','products','{\"id\": 13, \"sku\": \"test20002\", \"name\": \"test2\"}','::1','2026-06-29 18:15:32'),(12,1,'CREATE_PRODUCT','products','{\"id\": 14, \"sku\": \"test000005\", \"name\": \"test3\"}','::1','2026-06-29 18:15:32'),(13,1,'UPDATE_PROFILE','users','{\"full_name\": \"FounderSalesBI\"}','::1','2026-06-29 18:24:41'),(14,1,'UPDATE_USER','users','{\"id\": \"1\", \"role\": \"Admin\", \"email\": \"aminenouioui18@icloud.com\", \"role_id\": 1, \"full_name\": \"FounderSalesBI\"}','::1','2026-06-29 18:25:30'),(15,1,'UPDATE_ORDER_STATUS','orders','{\"id\": \"4\", \"status\": \"cancelled\", \"previousStatus\": \"completed\"}','::1','2026-06-29 18:56:16'),(16,1,'UPDATE_ORDER_STATUS','orders','{\"id\": \"2\", \"status\": \"cancelled\", \"previousStatus\": \"completed\"}','::1','2026-06-29 18:56:35'),(17,2,'UPDATE_USER','users','{\"id\": \"2\", \"role\": \"User\", \"email\": \"nouiouiamine20@gmail.com\", \"role_id\": 2, \"full_name\": \"test\"}','::1','2026-06-29 18:58:14'),(18,2,'CREATE_ORDER','orders','{\"id\": 5, \"status\": \"pending\", \"customer_id\": \"1\", \"totalAmount\": 1403178}','::1','2026-06-29 19:02:56'),(19,1,'UPDATE_ORDER_STATUS','orders','{\"id\": \"5\", \"status\": \"accepted\", \"previousStatus\": \"pending\"}','::1','2026-06-29 19:08:57');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `company` varchar(100) DEFAULT NULL,
  `last_purchase` datetime DEFAULT NULL,
  `total_spent` decimal(15,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_customer_email` (`email`),
  KEY `idx_customers_full_name` (`full_name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Mohamed Amine nouioui','nouiouiamine20@gmail.com','53236163','test','2026-06-27 14:13:29',11000.00,'2026-06-27 11:35:43');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `quantity` int DEFAULT '0',
  `low_stock_threshold` int DEFAULT '10',
  `last_restocked` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES (1,1,5,5,NULL),(2,2,100,10,NULL),(3,3,90,10,NULL),(4,13,105,10,NULL),(5,14,199,10,NULL);
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,10,1000.00,10000.00),(2,2,2,66,22222.00,1466652.00),(3,3,3,10,100.00,1000.00),(4,4,3,5,100.00,500.00),(5,5,14,7,200454.00,1403178.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `order_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(15,2) NOT NULL,
  `status` enum('pending','accepted','processing','completed','cancelled') DEFAULT 'pending',
  `payment_status` enum('unpaid','paid','failed','refunded') DEFAULT 'unpaid',
  `stripe_session_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `idx_order_date` (`order_date`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_stripe_session` (`stripe_session_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,'2026-06-27 12:36:22',10000.00,'completed','unpaid',NULL),(2,1,'2026-06-27 13:52:37',1466652.00,'cancelled','unpaid',NULL),(3,1,'2026-06-27 13:55:53',1000.00,'completed','unpaid',NULL),(4,1,'2026-06-27 14:13:29',500.00,'cancelled','unpaid',NULL),(5,1,'2026-06-29 20:02:56',1403178.00,'accepted','unpaid',NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'View Dashboard','dashboard.view','Ability to view main dashboard','2026-06-29 19:33:50'),(2,'Manage Products','products.manage','Create, update, and delete products','2026-06-29 19:33:50'),(3,'View Inventory','inventory.view','View stock levels','2026-06-29 19:33:50'),(4,'Adjust Stock','inventory.adjust','Manually adjust stock counts','2026-06-29 19:33:50'),(5,'Manage Customers','customers.manage','Create and edit customers','2026-06-29 19:33:50'),(6,'Create Orders','orders.create','Ability to place new orders','2026-06-29 19:33:50'),(7,'Approve Orders','orders.approve','Ability to accept/reject pending orders','2026-06-29 19:33:50'),(8,'Delete Orders','orders.delete','Ability to delete order records','2026-06-29 19:33:50'),(9,'View Reports','reports.view','Access sales and performance reports','2026-06-29 19:33:50'),(10,'Manage Users','users.manage','Create and edit staff accounts','2026-06-29 19:33:50'),(11,'View Audit Logs','audit.view','View system activity logs','2026-06-29 19:33:50'),(12,'Manage Settings','settings.manage','Change company and system settings','2026-06-29 19:33:50');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `cost` decimal(10,2) DEFAULT '0.00',
  `sku` varchar(50) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `idx_product_sku` (`sku`),
  KEY `idx_products_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'test','Electronics',1000.00,10.00,'test001','test','2026-06-27 11:34:13'),(2,'test','Electronics',22222.00,222.00,'test002','testtttttt','2026-06-27 12:52:00'),(3,'eya','Accessories',100.00,10.00,'eya001','eyabensaid','2026-06-27 12:55:12'),(13,'test2','Electronics',2000.00,0.00,'test20002','Imported on 29/06/2026','2026-06-29 18:15:32'),(14,'test3','Electronics',200454.00,0.00,'test000005','Imported on 29/06/2026','2026-06-29 18:15:32');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (7,'Accountant'),(1,'Admin'),(6,'Inventory Manager'),(4,'Manager'),(5,'Sales Representative'),(3,'Super Admin'),(2,'User'),(8,'Viewer');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `failed_login_attempts` int NOT NULL DEFAULT '0',
  `locked_until` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `password_updated_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'FounderSalesBI','aminenouioui18@icloud.com','$2b$12$Jxy435oQDaIJNX.l.btFduRW4.DCOzAyLed5q5JedE2G11mscgleG',1,0,NULL,'2026-06-29 20:07:31',0,NULL,'2026-06-26 02:33:49','2026-06-29 19:07:31'),(2,'test','nouiouiamine20@gmail.com','$2b$12$Jxy435oQDaIJNX.l.btFduRW4.DCOzAyLed5q5JedE2G11mscgleG',2,0,NULL,'2026-06-29 20:09:11',0,NULL,'2026-06-27 01:26:02','2026-06-29 19:09:11');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-29 20:38:22
