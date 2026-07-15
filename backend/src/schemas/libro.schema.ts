import { z } from 'zod';

export const crearLibroSchema = z.object({
  titulo: z.string().min(1).max(200),
  isbn: z.string().length(13).regex(/^[0-9]+$/, 'El ISBN debe tener exactamente 13 dígitos'),
  precio: z.number().positive(),
  stock: z.number().int().min(0),
  paginas: z.number().int().positive().optional(),
  publicado_en: z.number().int().min(1800).max(2100).optional(),
  autor_id: z.number().int().positive(),
  categoria_id: z.number().int().positive(),
});

export const actualizarLibroSchema = crearLibroSchema.partial();

export type CrearLibroDTO = z.infer<typeof crearLibroSchema>;
export type ActualizarLibroDTO = z.infer<typeof actualizarLibroSchema>;
