import { z } from 'zod';

const tipoContenidoEnum = z.enum([
  'Relato escrito',
  'Fotografía',
  'Video',
  'Audio',
  'Documento histórico',
  'Receta',
  'Testimonio comunitario',
  'Evento cultural',
  'Lugar recomendado',
]);

export const createPublicacionSchema = z.object({
  titulo: z.string().min(5),
  descripcion: z.string().min(10),
  tipo_contenido: tipoContenidoEnum,
  anio_contenido: z.number().int().min(1800).max(2100).optional(),
});

export const updatePublicacionSchema = createPublicacionSchema
  .partial()
  .extend({
    estado: z.enum(['Pendiente', 'Aprobada', 'Rechazada']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Se requiere al menos un campo para actualizar.',
  });

export type CreatePublicacionDTO = z.infer<typeof createPublicacionSchema>;
export type UpdatePublicacionDTO = z.infer<typeof updatePublicacionSchema>;
