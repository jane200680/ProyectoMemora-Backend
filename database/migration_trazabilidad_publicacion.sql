-- Migración: trazabilidad de la revisión de publicaciones (quién, cuándo, motivo)
-- Ejecutar una sola vez sobre una base de datos existente creada con schema.sql

USE `memora`;

ALTER TABLE `publicacion_cultural`
  ADD COLUMN `revisado_por` INT NULL DEFAULT NULL AFTER `anio_contenido`,
  ADD COLUMN `fecha_revision` DATETIME NULL DEFAULT NULL AFTER `revisado_por`,
  ADD COLUMN `motivo_rechazo` VARCHAR(500) NULL DEFAULT NULL AFTER `fecha_revision`,
  ADD INDEX `fk_publicacion_revisor` (`revisado_por` ASC),
  ADD CONSTRAINT `fk_publicacion_revisor`
    FOREIGN KEY (`revisado_por`)
    REFERENCES `usuario` (`id_usuario`)
    ON DELETE SET NULL;
