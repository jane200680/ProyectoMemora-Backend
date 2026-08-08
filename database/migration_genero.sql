-- Migración: campo de género opcional en usuario
-- Ejecutar una sola vez sobre una base de datos existente creada con schema.sql

USE `memora`;

ALTER TABLE `usuario`
  ADD COLUMN `genero` ENUM('Hombre', 'Mujer', 'Prefiero no decir') NULL DEFAULT NULL AFTER `google_id`;
