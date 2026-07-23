-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema memora
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `memora` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `memora` ;

-- -----------------------------------------------------
-- Table `memora`.`usuario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `memora`.`usuario` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nombre_usuario` VARCHAR(100) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(150) NOT NULL,
  `correo` VARCHAR(255) NOT NULL,
  `rol` ENUM('Administrador', 'Usuario') NOT NULL DEFAULT 'Usuario',
  `estado` ENUM('Activo', 'Inactivo', 'Suspendido') NOT NULL DEFAULT 'Activo',
  `fecha_registro` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `foto_perfil` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `nombre_usuario` (`nombre_usuario` ASC) VISIBLE,
  UNIQUE INDEX `correo` (`correo` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `memora`.`publicacion_cultural`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `memora`.`publicacion_cultural` (
  `id_publicacion` INT NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(200) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `fecha_publicacion` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo_contenido` ENUM('Relato escrito', 'Fotografía', 'Video', 'Audio', 'Documento histórico', 'Receta', 'Testimonio comunitario', 'Evento cultural', 'Lugar recomendado') NOT NULL,
  `estado` ENUM('Pendiente', 'Aprobada', 'Rechazada') NOT NULL DEFAULT 'Pendiente',
  `id_usuario` INT NOT NULL,
  `anio_contenido` YEAR NULL DEFAULT NULL,
  PRIMARY KEY (`id_publicacion`),
  INDEX `fk_publicacion_usuario` (`id_usuario` ASC) VISIBLE,
  CONSTRAINT `fk_publicacion_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `memora`.`usuario` (`id_usuario`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `memora`.`archivo_multimedia`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `memora`.`archivo_multimedia` (
  `id_archivo` INT NOT NULL AUTO_INCREMENT,
  `tipo_archivo` ENUM('Imagen', 'Video', 'Audio', 'Documento') NOT NULL,
  `url_archivo` VARCHAR(255) NOT NULL,
  `descripcion` TEXT NULL DEFAULT NULL,
  `id_publicacion` INT NOT NULL,
  PRIMARY KEY (`id_archivo`),
  INDEX `fk_archivo_publicacion` (`id_publicacion` ASC) VISIBLE,
  CONSTRAINT `fk_archivo_publicacion`
    FOREIGN KEY (`id_publicacion`)
    REFERENCES `memora`.`publicacion_cultural` (`id_publicacion`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `memora`.`autenticacion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `memora`.`autenticacion` (
  `id_autenticacion` INT NOT NULL AUTO_INCREMENT,
  `contrasena_hash` VARCHAR(255) NOT NULL,
  `ultimo_acceso` DATETIME NULL DEFAULT NULL,
  `fecha_actualizacion` DATETIME NULL DEFAULT NULL,
  `usuario_id_usuario` INT NOT NULL,
  PRIMARY KEY (`id_autenticacion`),
  UNIQUE INDEX `usuario_id_usuario` (`usuario_id_usuario` ASC) VISIBLE,
  CONSTRAINT `fk_autenticacion_usuario`
    FOREIGN KEY (`usuario_id_usuario`)
    REFERENCES `memora`.`usuario` (`id_usuario`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `memora`.`categoria_cultural`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `memora`.`categoria_cultural` (
  `id_categoria` INT NOT NULL AUTO_INCREMENT,
  `nombre_categoria` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NULL DEFAULT NULL,
  `icono` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id_categoria`),
  UNIQUE INDEX `nombre_categoria` (`nombre_categoria` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `memora`.`comentario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `memora`.`comentario` (
  `id_comentario` INT NOT NULL AUTO_INCREMENT,
  `contenido` TEXT NOT NULL,
  `fecha_comentario` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `id_usuario` INT NOT NULL,
  `id_publicacion` INT NOT NULL,
  `comentario_id_comentario` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_comentario`),
  INDEX `fk_comentario_usuario` (`id_usuario` ASC) VISIBLE,
  INDEX `fk_comentario_publicacion` (`id_publicacion` ASC) VISIBLE,
  INDEX `fk_comentario_respuesta` (`comentario_id_comentario` ASC) VISIBLE,
  CONSTRAINT `fk_comentario_publicacion`
    FOREIGN KEY (`id_publicacion`)
    REFERENCES `memora`.`publicacion_cultural` (`id_publicacion`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_comentario_respuesta`
    FOREIGN KEY (`comentario_id_comentario`)
    REFERENCES `memora`.`comentario` (`id_comentario`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_comentario_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `memora`.`usuario` (`id_usuario`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `memora`.`lugar_cultural`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `memora`.`lugar_cultural` (
  `id_lugar` INT NOT NULL AUTO_INCREMENT,
  `nombre_lugar` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NULL DEFAULT NULL,
  `direccion_referencial` VARCHAR(255) NULL DEFAULT NULL,
  `latitud` DECIMAL(10,8) NULL DEFAULT NULL,
  `longitud` DECIMAL(10,8) NULL DEFAULT NULL,
  PRIMARY KEY (`id_lugar`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `memora`.`notificacion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `memora`.`notificacion` (
  `id_notificacion` INT NOT NULL AUTO_INCREMENT,
  `mensaje` TEXT NOT NULL,
  `fecha_notificacion` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `leida` TINYINT NOT NULL DEFAULT '0',
  `usuario_id_usuario` INT NOT NULL,
  `publicacion_cultural_id_publicacion` INT NOT NULL,
  PRIMARY KEY (`id_notificacion`),
  INDEX `fk_notificacion_usuario` (`usuario_id_usuario` ASC) VISIBLE,
  INDEX `fk_notificacion_publicacion` (`publicacion_cultural_id_publicacion` ASC) VISIBLE,
  CONSTRAINT `fk_notificacion_publicacion`
    FOREIGN KEY (`publicacion_cultural_id_publicacion`)
    REFERENCES `memora`.`publicacion_cultural` (`id_publicacion`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_notificacion_usuario`
    FOREIGN KEY (`usuario_id_usuario`)
    REFERENCES `memora`.`usuario` (`id_usuario`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `memora`.`publicacion_cultural_has_categoria_cultural`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `memora`.`publicacion_cultural_has_categoria_cultural` (
  `publicacion_cultural_id_publicacion` INT NOT NULL,
  `categoria_cultural_id_categoria` INT NOT NULL,
  PRIMARY KEY (`publicacion_cultural_id_publicacion`, `categoria_cultural_id_categoria`),
  INDEX `fk_pub_cat_categoria` (`categoria_cultural_id_categoria` ASC) VISIBLE,
  CONSTRAINT `fk_pub_cat_categoria`
    FOREIGN KEY (`categoria_cultural_id_categoria`)
    REFERENCES `memora`.`categoria_cultural` (`id_categoria`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_pub_cat_publicacion`
    FOREIGN KEY (`publicacion_cultural_id_publicacion`)
    REFERENCES `memora`.`publicacion_cultural` (`id_publicacion`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `memora`.`publicacion_cultural_has_lugar_cultural`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `memora`.`publicacion_cultural_has_lugar_cultural` (
  `publicacion_cultural_id_publicacion` INT NOT NULL,
  `lugar_cultural_id_lugar` INT NOT NULL,
  PRIMARY KEY (`publicacion_cultural_id_publicacion`, `lugar_cultural_id_lugar`),
  INDEX `fk_pub_lugar_lugar` (`lugar_cultural_id_lugar` ASC) VISIBLE,
  CONSTRAINT `fk_pub_lugar_lugar`
    FOREIGN KEY (`lugar_cultural_id_lugar`)
    REFERENCES `memora`.`lugar_cultural` (`id_lugar`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_pub_lugar_publicacion`
    FOREIGN KEY (`publicacion_cultural_id_publicacion`)
    REFERENCES `memora`.`publicacion_cultural` (`id_publicacion`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
