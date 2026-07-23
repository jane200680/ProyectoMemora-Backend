import { HttpError } from "../middleware/errorHandler.js";
import {
  actualizarEstadoPublicacion as actualizarEstadoPublicacionRepo,
  findPendientes,
} from "../repositories/publicacion.repository.js";
import {
  actualizarEstadoUsuario as actualizarEstadoUsuarioRepo,
  listarUsuarios as listarUsuariosRepo,
} from "../repositories/usuario.repository.js";
import type { EstadoPublicacionInput, EstadoUsuarioInput } from "../schemas/admin.schema.js";

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
  input: EstadoPublicacionInput
) {
  const actualizado = await actualizarEstadoPublicacionRepo(idPublicacion, input);
  if (!actualizado) {
    throw new HttpError(404, "Publicación no encontrada");
  }
}
