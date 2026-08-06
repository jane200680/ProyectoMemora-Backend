import { z } from "zod";

export const estadoUsuarioSchema = z.object({
  estado: z.enum(["Activo", "Inactivo", "Suspendido"]),
});

export const estadoPublicacionSchema = z
  .object({
    estado: z.enum(["Aprobada", "Rechazada"]),
    motivo: z.string().trim().min(3).max(500).optional(),
  })
  .refine((data) => data.estado !== "Rechazada" || Boolean(data.motivo), {
    message: "Debes indicar el motivo del rechazo",
    path: ["motivo"],
  });

export const eliminarPublicacionAdminSchema = z.object({
  motivo: z.string().trim().min(3).max(500).optional(),
});

export const eliminarComentarioAdminSchema = z.object({
  motivo: z.string().trim().min(3).max(500).optional(),
});

export const categoriaSchema = z.object({
  nombre_categoria: z.string().trim().min(2).max(100),
  descripcion: z.string().trim().max(1000).optional(),
  icono: z.string().trim().max(255).optional(),
});

export const lugarSchema = z.object({
  nombre_lugar: z.string().trim().min(2).max(150),
  descripcion: z.string().trim().max(1000).optional(),
  direccion_referencial: z.string().trim().max(255).optional(),
  latitud: z.coerce.number().min(-90).max(90).optional(),
  longitud: z.coerce.number().min(-180).max(180).optional(),
});

export type EstadoUsuarioInput = z.infer<typeof estadoUsuarioSchema>;
export type EstadoPublicacionInput = z.infer<typeof estadoPublicacionSchema>;
export type EliminarPublicacionAdminInput = z.infer<typeof eliminarPublicacionAdminSchema>;
export type EliminarComentarioAdminInput = z.infer<typeof eliminarComentarioAdminSchema>;
export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type LugarInput = z.infer<typeof lugarSchema>;
