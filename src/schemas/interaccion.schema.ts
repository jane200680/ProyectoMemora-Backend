import { z } from "zod";

export const crearComentarioSchema = z.object({
  contenido: z.string().trim().min(1).max(2000),
  comentario_id_comentario: z.coerce.number().int().positive().optional(),
});

export type CrearComentarioInput = z.infer<typeof crearComentarioSchema>;
