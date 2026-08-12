import { z } from "zod";

export const tiposContenido = [
  "Relato escrito",
  "Fotografía",
  "Video",
  "Documento histórico",
  "Receta",
  "Testimonio comunitario",
  "Evento cultural",
  "Lugar recomendado",
] as const;

const anioActual = new Date().getFullYear();
export const ANIO_MINIMO_CONTENIDO = 1800;

const regexLinkGoogleMaps =
  /^https:\/\/(www\.)?(google\.[a-z.]{2,6}\/maps|maps\.google\.[a-z.]{2,6}|goo\.gl\/maps|maps\.app\.goo\.gl)\//i;

const linkGoogleMapsSchema = z
  .string()
  .trim()
  .url("Ingresa una URL válida.")
  .regex(regexLinkGoogleMaps, "Debe ser un link de Google Maps (maps.google.com o maps.app.goo.gl).");

function parseListaIds(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value.split(",").map((v) => v.trim());
    }
  }
  return value;
}

function requiereLinkGoogleMaps(input: { tipo_contenido: string; link_google_maps?: string }, ctx: z.RefinementCtx) {
  if (input.tipo_contenido === "Lugar recomendado" && !input.link_google_maps) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Para publicar en la categoría \"Lugar recomendado\" debes ingresar un link de Google Maps.",
      path: ["link_google_maps"],
    });
  }
}

export const crearPublicacionSchema = z
  .object({
    titulo: z.string().trim().min(3).max(200),
    descripcion: z.string().trim().min(10),
    tipo_contenido: z.enum(tiposContenido),
    anio_contenido: z.coerce.number().int().min(ANIO_MINIMO_CONTENIDO).max(anioActual).optional(),
    link_google_maps: linkGoogleMapsSchema.optional().or(z.literal("")),
    categorias: z.preprocess(parseListaIds, z.array(z.coerce.number().int().positive())).optional(),
    lugares: z.preprocess(parseListaIds, z.array(z.coerce.number().int().positive())).optional(),
  })
  .superRefine(requiereLinkGoogleMaps);

export type CrearPublicacionInput = z.infer<typeof crearPublicacionSchema>;

export const editarPublicacionSchema = z
  .object({
    titulo: z.string().trim().min(3).max(200),
    descripcion: z.string().trim().min(10),
    tipo_contenido: z.enum(tiposContenido),
    anio_contenido: z.coerce.number().int().min(ANIO_MINIMO_CONTENIDO).max(anioActual).optional(),
    link_google_maps: linkGoogleMapsSchema.optional().or(z.literal("")),
    categorias: z.preprocess(parseListaIds, z.array(z.coerce.number().int().positive())).default([]),
    lugares: z.preprocess(parseListaIds, z.array(z.coerce.number().int().positive())).default([]),
    archivos_eliminar: z
      .preprocess(parseListaIds, z.array(z.coerce.number().int().positive()))
      .default([]),
  })
  .superRefine(requiereLinkGoogleMaps);

export type EditarPublicacionInput = z.infer<typeof editarPublicacionSchema>;

export const feedQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().optional().default(1),
  limite: z.coerce.number().int().positive().max(50).optional().default(10),
  tipo_contenido: z.enum(tiposContenido).optional(),
  categoria: z.coerce.number().int().positive().optional(),
  lugar: z.coerce.number().int().positive().optional(),
  anio: z.coerce.number().int().min(1800).max(anioActual).optional(),
  q: z.string().trim().min(1).max(200).optional(),
});

export type FeedQueryInput = z.infer<typeof feedQuerySchema>;

export const misPublicacionesQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().optional().default(1),
  limite: z.coerce.number().int().positive().max(50).optional().default(10),
});

export type MisPublicacionesQueryInput = z.infer<typeof misPublicacionesQuerySchema>;
