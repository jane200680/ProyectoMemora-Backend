import {
  countFeedAprobado,
  crearPublicacion as crearPublicacionRepo,
  findFeedAprobado,
} from "../repositories/publicacion.repository.js";
import { subirArchivoS3 } from "./s3.service.js";
import type { CrearPublicacionInput } from "../schemas/publicacion.schema.js";
import type { ArchivoMultimediaInput, TipoArchivo } from "../types/publicacion.js";

export interface FeedItemDTO {
  id: number;
  autor: string;
  fotoPerfil: string | null;
  fecha: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  imagen: string | null;
  comentarios: number;
  reacciones: number;
  reacciono: boolean;
}

export interface FeedDTO {
  data: FeedItemDTO[];
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export async function obtenerFeed(
  pagina: number,
  limite: number,
  idUsuarioActual: number | null
): Promise<FeedDTO> {
  const offset = (pagina - 1) * limite;

  const [filas, total] = await Promise.all([
    findFeedAprobado(limite, offset, idUsuarioActual),
    countFeedAprobado(),
  ]);

  const data: FeedItemDTO[] = filas.map((fila) => ({
    id: fila.id_publicacion,
    autor: `${fila.nombre} ${fila.apellido}`,
    fotoPerfil: fila.foto_perfil,
    fecha: fila.fecha_publicacion.toISOString(),
    tipo: fila.tipo_contenido,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    imagen: fila.imagen,
    comentarios: fila.total_comentarios,
    reacciones: fila.total_reacciones,
    reacciono: Boolean(fila.reacciono),
  }));

  return {
    data,
    pagina,
    limite,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / limite)),
  };
}

function tipoArchivoDesdeMime(mimetype: string): TipoArchivo {
  if (mimetype.startsWith("image/")) return "Imagen";
  if (mimetype.startsWith("video/")) return "Video";
  if (mimetype.startsWith("audio/")) return "Audio";
  return "Documento";
}

export async function crearPublicacion(
  idUsuario: number,
  input: CrearPublicacionInput,
  archivos: Express.Multer.File[] = []
) {
  const archivosSubidos: ArchivoMultimediaInput[] = await Promise.all(
    archivos.map(async (archivo) => ({
      tipo_archivo: tipoArchivoDesdeMime(archivo.mimetype),
      url_archivo: await subirArchivoS3(archivo, "publicaciones"),
    }))
  );

  const idPublicacion = await crearPublicacionRepo(idUsuario, input, archivosSubidos);
  return { id_publicacion: idPublicacion, estado: "Pendiente" as const };
}
