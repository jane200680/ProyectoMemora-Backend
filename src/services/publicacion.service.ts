import {
  actualizarPublicacion as actualizarPublicacionRepo,
  countFeedAprobado,
  countFeedPorUsuario,
  crearPublicacion as crearPublicacionRepo,
  eliminarPublicacion as eliminarPublicacionRepo,
  findFeedAprobado,
  findFeedPorUsuario,
  findPublicacionAprobadaPorId,
  obtenerAutorPublicacion,
  obtenerDetallePublicacion,
  type FeedFiltros,
} from "../repositories/publicacion.repository.js";
import { HttpError } from "../middleware/errorHandler.js";
import { notificarAdminsPublicacionPendiente } from "./notificacion.service.js";
import { subirArchivoS3 } from "./s3.service.js";
import type { CrearPublicacionInput, EditarPublicacionInput } from "../schemas/publicacion.schema.js";
import type { ArchivoMultimediaInput, PublicacionFeedRow } from "../types/publicacion.js";
import {
  cumpleRequisitoArchivo,
  mensajeRequisitoArchivo,
  tipoArchivoDesdeMime,
} from "../utils/requisitosArchivo.js";

export interface ArchivoFeedDTO {
  tipo: "Imagen" | "Video" | "Documento";
  url: string;
}

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
  archivos: ArchivoFeedDTO[];
  comentarios: number;
  reacciones: number;
  reacciono: boolean;
  estado?: "Pendiente" | "Aprobada" | "Rechazada";
  fechaRevision?: string | null;
  motivoRechazo?: string | null;
  revisadoPor?: string | null;
}

function parsearArchivos(raw: string | null): ArchivoFeedDTO[] {
  if (!raw) return [];
  return raw.split("||").map((entrada) => {
    const [tipo, ...resto] = entrada.split("::");
    return { tipo: tipo as ArchivoFeedDTO["tipo"], url: resto.join("::") };
  });
}

export interface FeedDTO {
  data: FeedItemDTO[];
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

function mapFilaAFeedItem(fila: PublicacionFeedRow): FeedItemDTO {
  return {
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
    archivos: parsearArchivos(fila.archivos_raw),
    comentarios: fila.total_comentarios,
    reacciones: fila.total_reacciones,
    reacciono: Boolean(fila.reacciono),
    ...(fila.estado ? { estado: fila.estado } : {}),
    ...(fila.fecha_revision ? { fechaRevision: fila.fecha_revision.toISOString() } : {}),
    ...(fila.motivo_rechazo ? { motivoRechazo: fila.motivo_rechazo } : {}),
    ...(fila.revisado_por_nombre
      ? { revisadoPor: `${fila.revisado_por_nombre} ${fila.revisado_por_apellido}` }
      : {}),
  };
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

  return {
    data: filas.map(mapFilaAFeedItem),
    pagina,
    limite,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / limite)),
  };
}

export async function obtenerFeedPropio(
  idUsuario: number,
  pagina: number,
  limite: number
): Promise<FeedDTO> {
  const offset = (pagina - 1) * limite;

  const [filas, total] = await Promise.all([
    findFeedPorUsuario(idUsuario, limite, offset),
    countFeedPorUsuario(idUsuario),
  ]);

  return {
    data: filas.map(mapFilaAFeedItem),
    pagina,
    limite,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / limite)),
  };
}

export async function obtenerPublicacionPorId(
  idPublicacion: number,
  idUsuarioActual: number | null
): Promise<FeedItemDTO> {
  const fila = await findPublicacionAprobadaPorId(idPublicacion, idUsuarioActual);
  if (!fila) {
    throw new HttpError(404, "Publicación no encontrada");
  }

  return mapFilaAFeedItem(fila);
}

export async function crearPublicacion(
  idUsuario: number,
  input: CrearPublicacionInput,
  archivos: Express.Multer.File[] = []
) {
  const tiposArchivo = archivos.map((archivo) => tipoArchivoDesdeMime(archivo.mimetype));
  if (!cumpleRequisitoArchivo(input.tipo_contenido, tiposArchivo)) {
    throw new HttpError(400, mensajeRequisitoArchivo(input.tipo_contenido)!);
  }

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
  const detalle = await obtenerDetallePublicacion(idPublicacion);

  if (!detalle) {
    throw new HttpError(404, "Publicación no encontrada");
  }

  if (detalle.id_usuario !== idUsuario) {
    throw new HttpError(403, "No puedes editar una publicación que no es tuya");
  }

  const tiposArchivoExistentes = detalle.archivos
    .filter((archivo) => !input.archivos_eliminar.includes(archivo.id_archivo))
    .map((archivo) => archivo.tipo_archivo);
  const tiposArchivoNuevos = archivos.map((archivo) => tipoArchivoDesdeMime(archivo.mimetype));

  if (!cumpleRequisitoArchivo(input.tipo_contenido, [...tiposArchivoExistentes, ...tiposArchivoNuevos])) {
    throw new HttpError(400, mensajeRequisitoArchivo(input.tipo_contenido)!);
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
