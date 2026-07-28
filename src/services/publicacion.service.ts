import {
  actualizarPublicacion as actualizarPublicacionRepo,
  countFeedAprobado,
  crearPublicacion as crearPublicacionRepo,
  eliminarPublicacion as eliminarPublicacionRepo,
  findFeedAprobado,
  obtenerAutorPublicacion,
  obtenerDetallePublicacion,
  type FeedFiltros,
} from "../repositories/publicacion.repository.js";
import { HttpError } from "../middleware/errorHandler.js";
import { notificarAdminsPublicacionPendiente } from "./notificacion.service.js";
import { subirArchivoS3 } from "./s3.service.js";
import type { CrearPublicacionInput, EditarPublicacionInput } from "../schemas/publicacion.schema.js";
import type { ArchivoMultimediaInput, TipoArchivo } from "../types/publicacion.js";

export interface FeedItemDTO {
  id: number;
  idAutor: number;
  autor: string;
  fotoPerfil: string | null;
  fecha: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  imagen: string | null;
  imagenes: string[];
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
  idUsuarioActual: number | null,
  filtros: FeedFiltros = {}
): Promise<FeedDTO> {
  const offset = (pagina - 1) * limite;

  const [filas, total] = await Promise.all([
    findFeedAprobado(limite, offset, idUsuarioActual, filtros),
    countFeedAprobado(filtros),
  ]);

  const data: FeedItemDTO[] = filas.map((fila) => ({
    id: fila.id_publicacion,
    idAutor: fila.id_usuario,
    autor: `${fila.nombre} ${fila.apellido}`,
    fotoPerfil: fila.foto_perfil,
    fecha: fila.fecha_publicacion.toISOString(),
    tipo: fila.tipo_contenido,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    imagen: fila.imagen,
    imagenes: fila.imagenes ? fila.imagenes.split("||") : [],
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
  await notificarAdminsPublicacionPendiente(idPublicacion, input.titulo);
  return { id_publicacion: idPublicacion, estado: "Pendiente" as const };
}

export async function eliminarPublicacion(idUsuario: number, idPublicacion: number): Promise<void> {
  const publicacion = await obtenerAutorPublicacion(idPublicacion);

  if (!publicacion) {
    throw new HttpError(404, "Publicación no encontrada");
  }

  if (publicacion.id_usuario !== idUsuario) {
    throw new HttpError(403, "No puedes eliminar una publicación que no es tuya");
  }

  await eliminarPublicacionRepo(idPublicacion);
}

export async function obtenerPublicacionPropia(idUsuario: number, idPublicacion: number) {
  const detalle = await obtenerDetallePublicacion(idPublicacion);

  if (!detalle) {
    throw new HttpError(404, "Publicación no encontrada");
  }

  if (detalle.id_usuario !== idUsuario) {
    throw new HttpError(403, "No puedes editar una publicación que no es tuya");
  }

  const { id_usuario: _idUsuario, ...resto } = detalle;
  return resto;
}

export async function editarPublicacion(
  idUsuario: number,
  idPublicacion: number,
  input: EditarPublicacionInput,
  archivos: Express.Multer.File[] = []
): Promise<void> {
  const publicacion = await obtenerAutorPublicacion(idPublicacion);

  if (!publicacion) {
    throw new HttpError(404, "Publicación no encontrada");
  }

  if (publicacion.id_usuario !== idUsuario) {
    throw new HttpError(403, "No puedes editar una publicación que no es tuya");
  }

  const archivosSubidos: ArchivoMultimediaInput[] = await Promise.all(
    archivos.map(async (archivo) => ({
      tipo_archivo: tipoArchivoDesdeMime(archivo.mimetype),
      url_archivo: await subirArchivoS3(archivo, "publicaciones"),
    }))
  );

  await actualizarPublicacionRepo(idPublicacion, input, archivosSubidos);
  await notificarAdminsPublicacionPendiente(idPublicacion, input.titulo);
}
