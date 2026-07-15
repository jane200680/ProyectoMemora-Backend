-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: memora
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `archivo_multimedia`
--

DROP TABLE IF EXISTS `archivo_multimedia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archivo_multimedia` (
  `id_archivo` int NOT NULL AUTO_INCREMENT,
  `tipo_archivo` enum('Imagen','Video','Audio','Documento') NOT NULL,
  `url_archivo` varchar(255) NOT NULL,
  `descripcion` text,
  `id_publicacion` int NOT NULL,
  PRIMARY KEY (`id_archivo`),
  KEY `fk_archivo_publicacion` (`id_publicacion`),
  CONSTRAINT `fk_archivo_publicacion` FOREIGN KEY (`id_publicacion`) REFERENCES `publicacion_cultural` (`id_publicacion`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archivo_multimedia`
--

LOCK TABLES `archivo_multimedia` WRITE;
/*!40000 ALTER TABLE `archivo_multimedia` DISABLE KEYS */;
/*!40000 ALTER TABLE `archivo_multimedia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `autenticacion`
--

DROP TABLE IF EXISTS `autenticacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `autenticacion` (
  `id_autenticacion` int NOT NULL AUTO_INCREMENT,
  `contrasena_hash` varchar(255) NOT NULL,
  `ultimo_acceso` datetime DEFAULT NULL,
  `fecha_actualizacion` datetime DEFAULT NULL,
  `usuario_id_usuario` int NOT NULL,
  PRIMARY KEY (`id_autenticacion`),
  UNIQUE KEY `usuario_id_usuario` (`usuario_id_usuario`),
  CONSTRAINT `fk_autenticacion_usuario` FOREIGN KEY (`usuario_id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `autenticacion`
--

LOCK TABLES `autenticacion` WRITE;
/*!40000 ALTER TABLE `autenticacion` DISABLE KEYS */;
INSERT INTO `autenticacion` VALUES (1,'$2b$10$C6r24EYKHESB5J0qnymlvuAdbvjS5uNqQK6tJZUy3hAbaghkQ29bC',NULL,NULL,1);
/*!40000 ALTER TABLE `autenticacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categoria_cultural`
--

DROP TABLE IF EXISTS `categoria_cultural`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria_cultural` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(100) NOT NULL,
  `descripcion` text,
  `icono` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `nombre_categoria` (`nombre_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoria_cultural`
--

LOCK TABLES `categoria_cultural` WRITE;
/*!40000 ALTER TABLE `categoria_cultural` DISABLE KEYS */;
/*!40000 ALTER TABLE `categoria_cultural` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentario`
--

DROP TABLE IF EXISTS `comentario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comentario` (
  `id_comentario` int NOT NULL AUTO_INCREMENT,
  `contenido` text NOT NULL,
  `fecha_comentario` datetime DEFAULT CURRENT_TIMESTAMP,
  `id_usuario` int NOT NULL,
  `id_publicacion` int NOT NULL,
  `comentario_id_comentario` int DEFAULT NULL,
  PRIMARY KEY (`id_comentario`),
  KEY `fk_comentario_usuario` (`id_usuario`),
  KEY `fk_comentario_publicacion` (`id_publicacion`),
  KEY `fk_comentario_respuesta` (`comentario_id_comentario`),
  CONSTRAINT `fk_comentario_publicacion` FOREIGN KEY (`id_publicacion`) REFERENCES `publicacion_cultural` (`id_publicacion`) ON DELETE CASCADE,
  CONSTRAINT `fk_comentario_respuesta` FOREIGN KEY (`comentario_id_comentario`) REFERENCES `comentario` (`id_comentario`) ON DELETE CASCADE,
  CONSTRAINT `fk_comentario_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentario`
--

LOCK TABLES `comentario` WRITE;
/*!40000 ALTER TABLE `comentario` DISABLE KEYS */;
/*!40000 ALTER TABLE `comentario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lugar_cultural`
--

DROP TABLE IF EXISTS `lugar_cultural`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lugar_cultural` (
  `id_lugar` int NOT NULL AUTO_INCREMENT,
  `nombre_lugar` varchar(150) NOT NULL,
  `descripcion` text,
  `direccion_referencial` varchar(255) DEFAULT NULL,
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(10,8) DEFAULT NULL,
  PRIMARY KEY (`id_lugar`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lugar_cultural`
--

LOCK TABLES `lugar_cultural` WRITE;
/*!40000 ALTER TABLE `lugar_cultural` DISABLE KEYS */;
/*!40000 ALTER TABLE `lugar_cultural` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacion`
--

DROP TABLE IF EXISTS `notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacion` (
  `id_notificacion` int NOT NULL AUTO_INCREMENT,
  `mensaje` text NOT NULL,
  `fecha_notificacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `leida` tinyint NOT NULL DEFAULT '0',
  `usuario_id_usuario` int NOT NULL,
  `publicacion_cultural_id_publicacion` int NOT NULL,
  PRIMARY KEY (`id_notificacion`),
  KEY `fk_notificacion_usuario` (`usuario_id_usuario`),
  KEY `fk_notificacion_publicacion` (`publicacion_cultural_id_publicacion`),
  CONSTRAINT `fk_notificacion_publicacion` FOREIGN KEY (`publicacion_cultural_id_publicacion`) REFERENCES `publicacion_cultural` (`id_publicacion`) ON DELETE CASCADE,
  CONSTRAINT `fk_notificacion_usuario` FOREIGN KEY (`usuario_id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacion`
--

LOCK TABLES `notificacion` WRITE;
/*!40000 ALTER TABLE `notificacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publicacion_cultural`
--

DROP TABLE IF EXISTS `publicacion_cultural`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `publicacion_cultural` (
  `id_publicacion` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text NOT NULL,
  `fecha_publicacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `tipo_contenido` enum('Relato escrito','Fotografía','Video','Audio','Documento histórico','Receta','Testimonio comunitario','Evento cultural','Lugar recomendado') NOT NULL,
  `estado` enum('Pendiente','Aprobada','Rechazada') NOT NULL DEFAULT 'Pendiente',
  `id_usuario` int NOT NULL,
  `anio_contenido` year DEFAULT NULL,
  PRIMARY KEY (`id_publicacion`),
  KEY `fk_publicacion_usuario` (`id_usuario`),
  CONSTRAINT `fk_publicacion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publicacion_cultural`
--

LOCK TABLES `publicacion_cultural` WRITE;
/*!40000 ALTER TABLE `publicacion_cultural` DISABLE KEYS */;
/*!40000 ALTER TABLE `publicacion_cultural` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publicacion_cultural_has_categoria_cultural`
--

DROP TABLE IF EXISTS `publicacion_cultural_has_categoria_cultural`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `publicacion_cultural_has_categoria_cultural` (
  `publicacion_cultural_id_publicacion` int NOT NULL,
  `categoria_cultural_id_categoria` int NOT NULL,
  PRIMARY KEY (`publicacion_cultural_id_publicacion`,`categoria_cultural_id_categoria`),
  KEY `fk_pub_cat_categoria` (`categoria_cultural_id_categoria`),
  CONSTRAINT `fk_pub_cat_categoria` FOREIGN KEY (`categoria_cultural_id_categoria`) REFERENCES `categoria_cultural` (`id_categoria`) ON DELETE CASCADE,
  CONSTRAINT `fk_pub_cat_publicacion` FOREIGN KEY (`publicacion_cultural_id_publicacion`) REFERENCES `publicacion_cultural` (`id_publicacion`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publicacion_cultural_has_categoria_cultural`
--

LOCK TABLES `publicacion_cultural_has_categoria_cultural` WRITE;
/*!40000 ALTER TABLE `publicacion_cultural_has_categoria_cultural` DISABLE KEYS */;
/*!40000 ALTER TABLE `publicacion_cultural_has_categoria_cultural` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publicacion_cultural_has_lugar_cultural`
--

DROP TABLE IF EXISTS `publicacion_cultural_has_lugar_cultural`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `publicacion_cultural_has_lugar_cultural` (
  `publicacion_cultural_id_publicacion` int NOT NULL,
  `lugar_cultural_id_lugar` int NOT NULL,
  PRIMARY KEY (`publicacion_cultural_id_publicacion`,`lugar_cultural_id_lugar`),
  KEY `fk_pub_lugar_lugar` (`lugar_cultural_id_lugar`),
  CONSTRAINT `fk_pub_lugar_lugar` FOREIGN KEY (`lugar_cultural_id_lugar`) REFERENCES `lugar_cultural` (`id_lugar`) ON DELETE CASCADE,
  CONSTRAINT `fk_pub_lugar_publicacion` FOREIGN KEY (`publicacion_cultural_id_publicacion`) REFERENCES `publicacion_cultural` (`id_publicacion`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publicacion_cultural_has_lugar_cultural`
--

LOCK TABLES `publicacion_cultural_has_lugar_cultural` WRITE;
/*!40000 ALTER TABLE `publicacion_cultural_has_lugar_cultural` DISABLE KEYS */;
/*!40000 ALTER TABLE `publicacion_cultural_has_lugar_cultural` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre_usuario` varchar(100) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(150) NOT NULL,
  `correo` varchar(255) NOT NULL,
  `rol` enum('Administrador','Usuario') NOT NULL DEFAULT 'Usuario',
  `estado` enum('Activo','Inactivo','Suspendido') NOT NULL DEFAULT 'Activo',
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  `foto_perfil` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `nombre_usuario` (`nombre_usuario`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'janeee_mc','JANNETH','MEDINA','jannethmedina144@gmail.com','Usuario','Activo','2026-06-29 22:38:52',NULL);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-01 22:21:39
