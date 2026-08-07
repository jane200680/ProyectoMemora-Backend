-- Migración: soporte de inicio de sesión con Google
-- Ejecutar una sola vez sobre una base de datos existente creada con schema.sql

USE `memora`;

ALTER TABLE `usuario`
  ADD COLUMN `google_id` VARCHAR(255) NULL DEFAULT NULL AFTER `foto_perfil`,
  ADD UNIQUE INDEX `google_id` (`google_id` ASC) VISIBLE;

ALTER TABLE `autenticacion`
  MODIFY COLUMN `contrasena_hash` VARCHAR(255) NULL DEFAULT NULL;
