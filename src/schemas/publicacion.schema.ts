import { z } from "zod";

export const tiposContenido = [
  "Relato escrito",
  "Fotografía",
  "Video",
  "Audio",
  "Documento histórico",
  "Receta",
  "Testimonio comunitario",
  "Evento cultural",
  "Lugar recomendado",
] as const;

const anioActual = new Date().getFullYear();

export const crearPublicacionSchema = z.object({
  titulo: z.string().trim().min(3).max(200),
  descripcion: z.string().trim().min(10),
  tipo_contenido: z.enum(tiposContenido),
  anio_contenido: z.coerce.number().int().min(1800).max(anioActual).optional(),
  categorias: z.array(z.coerce.number().int().positive()).optional(),
  lugares: z.array(z.coerce.number().int().positive()).optional(),
});

export type CrearPublicacionInput = z.infer<typeof crearPublicacionSchema>;
