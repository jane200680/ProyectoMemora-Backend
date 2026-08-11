import { HttpError } from "../middleware/errorHandler.js";
import {
  actualizarEstadoPublicacion as actualizarEstadoPublicacionRepo,
  eliminarPublicacion as eliminarPublicacionRepo,
  findPendientes,
  obtenerAutorPublicacion,
} from "../repositories/publicacion.repository.js";
import {
  actualizarEstadoUsuario as actualizarEstadoUsuarioRepo,
  listarUsuarios as listarUsuariosRepo,
} from "../repositories/usuario.repository.js";
import type { EstadoPublicacionInput, EstadoUsuarioInput } from "../schemas/admin.schema.js";
import {
  notificarCambioEstadoPublicacion,
  notificarEliminacionPublicacion,
} from "./notificacion.service.js";

export async function listarUsuarios() {
  return listarUsuariosRepo();
}

export async function actualizarEstadoUsuario(idUsuario: number, input: EstadoUsuarioInput) {
  const actualizado = await actualizarEstadoUsuarioRepo(idUsuario, input);
  if (!actualizado) {
    throw new HttpError(404, "Usuario no encontrado");
  }
}

export async function listarPublicacionesPendientes() {
  const filas = await findPendientes();
  return filas.map((fila) => ({
    id: fila.id_publicacion,
    autor: `${fila.nombre} ${fila.apellido}`,
    fecha: fila.fecha_publicacion.toISOString(),
    tipo: fila.tipo_contenido,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    imagen: fila.imagen,
  }));
}

export async function actualizarEstadoPublicacion(
  idPublicacion: number,
  input: EstadoPublicacionInput,
  idRevisor: number
) {
  const actualizado = await actualizarEstadoPublicacionRepo(idPublicacion, input, idRevisor);
  if (!actualizado) {
    throw new HttpError(404, "Publicación no encontrada");
  }

  await notificarCambioEstadoPublicacion(idPublicacion, input.estado, input.motivo);
}

export async function eliminarPublicacionAdmin(idPublicacion: number, motivo?: string) {
  const publicacion = await obtenerAutorPublicacion(idPublicacion);
  if (!publicacion) {
    throw new HttpError(404, "Publicación no encontrada");
  }

  await eliminarPublicacionRepo(idPublicacion);
  await notificarEliminacionPublicacion(publicacion.id_usuario, publicacion.titulo, motivo);
}
