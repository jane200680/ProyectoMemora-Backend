import { z } from "zod";

export const estadoUsuarioSchema = z.object({
  estado: z.enum(["Activo", "Inactivo", "Suspendido"]),
});

export const estadoPublicacionSchema = z.object({
  estado: z.enum(["Aprobada", "Rechazada"]),
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
export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type LugarInput = z.infer<typeof lugarSchema>;
