-- Migración: link de Google Maps para publicaciones de tipo "Lugar recomendado"
-- Ejecutar una sola vez sobre una base de datos existente creada con schema.sql

USE `memora`;

ALTER TABLE `publicacion_cultural`
  ADD COLUMN `link_google_maps` VARCHAR(500) NULL DEFAULT NULL AFTER `anio_contenido`;
