import type { TipoArchivo, TipoContenido } from "../types/publicacion.js";

export const REQUISITO_ARCHIVO_POR_TIPO: Partial<Record<TipoContenido, TipoArchivo>> = {
  Fotografía: "Imagen",
  Video: "Video",
  "Documento histórico": "Documento",
  Receta: "Imagen",
  "Evento cultural": "Imagen",
  "Lugar recomendado": "Imagen",
};

const ETIQUETA_ARCHIVO: Record<TipoArchivo, string> = {
  Imagen: "una foto",
  Video: "un video",
  Documento: "un documento (PDF)",
};

export function tipoArchivoDesdeMime(mimetype: string): TipoArchivo {
  if (mimetype.startsWith("image/")) return "Imagen";
  if (mimetype.startsWith("video/")) return "Video";
  return "Documento";
}

export function mensajeRequisitoArchivo(tipoContenido: TipoContenido): string | null {
  const requerido = REQUISITO_ARCHIVO_POR_TIPO[tipoContenido];
  if (!requerido) return null;
  return `Para publicar en la categoría "${tipoContenido}" debes adjuntar ${ETIQUETA_ARCHIVO[requerido]}.`;
}

export function cumpleRequisitoArchivo(
  tipoContenido: TipoContenido,
  tiposArchivoDisponibles: TipoArchivo[]
): boolean {
  const requerido = REQUISITO_ARCHIVO_POR_TIPO[tipoContenido];
  if (!requerido) return true;
  return tiposArchivoDisponibles.includes(requerido);
}
