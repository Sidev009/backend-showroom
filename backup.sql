-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: aneka_mobil
-- ------------------------------------------------------
-- Server version	8.0.44

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
-- Table structure for table `articles`
--

DROP TABLE IF EXISTS `articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `category` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `articles`
--

LOCK TABLES `articles` WRITE;
/*!40000 ALTER TABLE `articles` DISABLE KEYS */;
INSERT INTO `articles` VALUES (1,'10 Panduan Membeli Mobil Bekas untuk Pemula, Agar Tidak Rugi!','','article-1772354070764-562207174.jpeg','2026-02-23 14:52:44','Tips'),(2,'Pasar Sedan Kecil, Ini Alasan Toyota Luncurkan Vios Hybrid di RI','','article-1772357596443-975883735.webp','2026-03-01 09:33:16','Otomotif'),(3,'Siap Adu Gengsi! Ini 12 Rekomendasi SUV Listrik untuk Mudik Tahun 2026, Siapa Juaranya? ','https://momobil.id/news/rekomendasi-suv-listrik-keluarga-untuk-mudik','article-1772357676142-955956401.webp','2026-03-01 09:34:36','Otomotif'),(4,'Demi Keselamatan! China Wajibkan Tombol Fisik Mobil Mulai 2027','https://momobil.id/news/demi-keselamatan-china-wajibkan-tombol-fisik-mobil-mulai-2027','article-1772357756625-753078795.webp','2026-03-01 09:35:56','Otomotif');
/*!40000 ALTER TABLE `articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `car_images`
--

DROP TABLE IF EXISTS `car_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `car_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `car_id` int NOT NULL,
  `image_path` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `car_id` (`car_id`),
  CONSTRAINT `car_images_ibfk_1` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `car_images`
--

LOCK TABLES `car_images` WRITE;
/*!40000 ALTER TABLE `car_images` DISABLE KEYS */;
INSERT INTO `car_images` VALUES (11,11,'1772359814129-download (4).jpeg'),(12,11,'1772359814132-download (3).jpeg'),(13,11,'1772359814133-rekomendasi-suv-listrik-keluarga-untuk-mudik-2026.webp'),(14,11,'1772359814147-zigi-69a17bb2870fc-toyota-vios-hybrid_910_512.webp'),(19,13,'1772359960963-download (5).jpeg'),(20,13,'1772359960963-download (4).jpeg'),(21,13,'1772359960964-download (3).jpeg'),(22,13,'1772359960964-rekomendasi-suv-listrik-keluarga-untuk-mudik-2026.webp');
/*!40000 ALTER TABLE `car_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cars`
--

DROP TABLE IF EXISTS `cars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cars` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `price` bigint DEFAULT NULL,
  `credit_price` bigint DEFAULT NULL,
  `year` int DEFAULT NULL,
  `image` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `km` int DEFAULT NULL,
  `transmission` varchar(100) DEFAULT NULL,
  `fuel` varchar(100) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cars`
--

LOCK TABLES `cars` WRITE;
/*!40000 ALTER TABLE `cars` DISABLE KEYS */;
INSERT INTO `cars` VALUES (11,'Kijang Innova','toyota',210000000,195000000,2024,NULL,'2026-02-28 05:19:07',20000,'Otomatis','Bensin','DP 10 jt\r\nBebas tabrak\r\nBukan bekas banjir\r\nSurat lengkap\r\nPajak hidup\r\nFree test drive'),(13,'Avanza','Toyoya',210000000,180000000,2024,'1772359960963-download (5).jpeg','2026-03-01 10:12:40',30000,'Manual','Bensin','DP 10 jt\r\nBebas tabrak\r\nBukan bekas banjir\r\nSurat lengkap\r\nPajak hidup\r\nFree test drive');
/*!40000 ALTER TABLE `cars` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promo_banners`
--

DROP TABLE IF EXISTS `promo_banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_banners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `image_path` varchar(255) NOT NULL,
  `link_url` varchar(255) DEFAULT NULL,
  `position` varchar(50) DEFAULT 'home',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `clicks` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promo_banners`
--

LOCK TABLES `promo_banners` WRITE;
/*!40000 ALTER TABLE `promo_banners` DISABLE KEYS */;
INSERT INTO `promo_banners` VALUES (1,'Promo Adira Finance','banner-1772384938879-244467533.webp',NULL,'home',NULL,NULL,1,0,'2026-03-01 16:53:24');
/*!40000 ALTER TABLE `promo_banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tiktok_videos`
--

DROP TABLE IF EXISTS `tiktok_videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tiktok_videos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `url` text NOT NULL,
  `thumbnail_url` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tiktok_videos`
--

LOCK TABLES `tiktok_videos` WRITE;
/*!40000 ALTER TABLE `tiktok_videos` DISABLE KEYS */;
INSERT INTO `tiktok_videos` VALUES (2,'Matic Dibawah 100 JT Nih','https://www.tiktok.com/@marketingfalah/video/7608129733397679367?is_from_webapp=1&sender_device=pc&web_id=7588094431430166034','https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oExAlBCIG9isA5rfCw9VPq0bgqIKyAdGiIKABs~tplv-tiktokx-origin.image?dr=14575&x-expires=1772524800&x-signature=pj2ngD9HBH9xPJGojmAoxR56jO8%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3','2026-02-28 08:29:31'),(8,'Hasil Detailing Expander','https://www.tiktok.com/@marketingfalah/video/7608501418332294421?is_from_webapp=1&sender_device=pc&web_id=7588094431430166034','https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oQ6tRp9HlU5EEpfMBAQxd6MfyyEgcFQDHYUBgt~tplv-tiktokx-dmt-logom:tos-alisg-i-0068/ogGZ5vAEEDisAxWBbAT08YilBxAYrbHACIa2Y.image?dr=14573&x-expires=1772452800&x-signature=fK57GD0eFHigI39g0xEHYIowwcI%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3','2026-02-28 12:22:24'),(9,'Pesona pajero 2018 ultimate','https://www.tiktok.com/@marketingfalah/video/7606308741364911381?is_from_webapp=1&sender_device=pc&web_id=7588094431430166034','https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oYaPvAQ2YIYYOBX81siWHiGJIEClB4CA87925~tplv-tiktokx-origin.image?dr=14575&x-expires=1772452800&x-signature=kAYHudd%2F1ERXk0HEDOgHXYXgJEE%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3','2026-02-28 12:23:37'),(10,'Calya 2022, Mobil Tangguh','https://www.tiktok.com/@marketingfalah/video/7609960577494043924?is_from_webapp=1&sender_device=pc&web_id=7588094431430166034','https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/ogfTQdj2I6DNqcOEpAF3DQfvDw1AQAC8fWS4NA~tplv-tiktokx-dmt-logom:tos-alisg-i-0068/oEnAVCEAuDDARWg7LeAlFgcBf8cACpIEAkEoAD.image?dr=14573&x-expires=1772524800&x-signature=fImMtHnMb8MAe8FrmecchQL0F0M%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3','2026-03-01 08:25:17'),(11,'Ertiga Gl 2018','https://www.tiktok.com/@marketingfalah/video/7607406489149426965?is_from_webapp=1&sender_device=pc&web_id=7588094431430166034','https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oMEfIQIGAKeGGtcA3m7lReCQ9ALeQGASTXJOQA~tplv-tiktokx-dmt-logom:tos-alisg-i-0068/oAklsUAQErDAJouFdwE3ET3fmATDjIAAIHeDfm.image?dr=14573&x-expires=1772524800&x-signature=LvzS5dIAwoJRnm9bJjSvHJMZn9A%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3','2026-03-01 08:26:51'),(12,'Innova G disel 2015 siap tampil','https://www.tiktok.com/@marketingfalah/video/7605573114843516181?is_from_webapp=1&sender_device=pc&web_id=7588094431430166034','https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/ogxvIcEAZDAIbmVb6GFeBRpIKEXgqB0jIKfSME~tplv-tiktokx-origin.image?dr=14575&x-expires=1772524800&x-signature=5LrGF56nWc0MR4Yna6PrHSuKRxo%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3','2026-03-01 08:27:48'),(13,'Pajero sold out boss..','https://www.tiktok.com/@marketingfalah/video/7607427956339674389?is_from_webapp=1&sender_device=pc&web_id=7588094431430166034','https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oEGyBf8jCiEqISBqVE0wiAOTIjIYAtoKmACzjy~tplv-tiktokx-dmt-logom:tos-alisg-i-0068/oEAil5gHA1BEZB7LiAB0WaTnCFIYTREvAAMQi.image?dr=14573&x-expires=1772524800&x-signature=GYoH0CMHW8vD5dA24OJ8zMCHXaQ%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3','2026-03-01 08:28:58'),(14,'Inova Diesel 2015,Unit Spesial','https://www.tiktok.com/@marketingfalah/video/7605181048032414996?is_from_webapp=1&sender_device=pc&web_id=7588094431430166034','https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/ocQYWTNIfCgoFAjHkTQAcFEDcDD5CFEE6f0e9o~tplv-tiktokx-origin.image?dr=14575&x-expires=1772524800&x-signature=X3sq0HLr4uS%2FKEatYaHAVx%2FjALs%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3','2026-03-01 08:29:53');
/*!40000 ALTER TABLE `tiktok_videos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:03:51
