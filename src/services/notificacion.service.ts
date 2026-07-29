import { HttpError } from "../middleware/errorHandler.js";
import {
  contarNoLeidas,
  crearNotificacion,
  crearNotificacionesParaUsuarios,
  listarNotificaciones as listarNotificacionesRepo,
  marcarLeida as marcarLeidaRepo,
  marcarTodasLeidas as marcarTodasLeidasRepo,
} from "../repositories/notificacion.repository.js";
import { obtenerAutorPublicacion } from "../repositories/publicacion.repository.js";
import {
  listarIdsAdministradores,
  obtenerNombreUsuario,
} from "../repositories/usuario.repository.js";

export interface NotificacionDTO {
  id: number;
  mensaje: string;
  fecha: string;
  leida: boolean;
  idPublicacion: number;
}

export async function listarNotificaciones(idUsuario: number) {
  const [filas, noLeidas] = await Promise.all([
    listarNotificacionesRepo(idUsuario),
    contarNoLeidas(idUsuario),
  ]);

  const data: NotificacionDTO[] = filas.map((fila) => ({
    id: fila.id_notificacion,
    mensaje: fila.mensaje,
    fecha: fila.fecha_notificacion.toISOString(),
    leida: Boolean(fila.leida),
    idPublicacion: fila.publicacion_cultural_id_publicacion,
  }));

  return { data, noLeidas };
}

export async function marcarNotificacionLeida(idUsuario: number, idNotificacion: number) {
  const actualizada = await marcarLeidaRepo(idNotificacion, idUsuario);
  if (!actualizada) {
    throw new HttpError(404, "Notificación no encontrada");
  }
}

export async function marcarTodasLasNotificacionesLeidas(idUsuario: number) {
  await marcarTodasLeidasRepo(idUsuario);
}

export async function notificarCambioEstadoPublicacion(
  idPublicacion: number,
  estado: "Aprobada" | "Rechazada",
  motivo?: string
) {
  const publicacion = await obtenerAutorPublicacion(idPublicacion);
  if (!publicacion) return;

  const mensaje =
    estado === "Aprobada"
      ? `Tu publicación "${publicacion.titulo}" fue aprobada.`
      : `Tu publicación "${publicacion.titulo}" fue rechazada. Motivo: ${motivo}`;

  await crearNotificacion(publicacion.id_usuario, idPublicacion, mensaje);
}

export async function notificarNuevaInteraccion(
  idPublicacion: number,
  idActor: number,
  tipo: "comentario" | "reaccion"
) {
  const publicacion = await obtenerAutorPublicacion(idPublicacion);
  if (!publicacion || publicacion.id_usuario === idActor) return;

  const actor = await obtenerNombreUsuario(idActor);
  const nombreActor = actor ? `${actor.nombre} ${actor.apellido}` : "Alguien";
  const accion = tipo === "comentario" ? "comentó" : "reaccionó a";

  await crearNotificacion(
    publicacion.id_usuario,
    idPublicacion,
    `${nombreActor} ${accion} tu publicación "${publicacion.titulo}".`
  );
}

export async function notificarAdminsPublicacionPendiente(
  idPublicacion: number,
  titulo: string
) {
  const idsAdmins = await listarIdsAdministradores();
  await crearNotificacionesParaUsuarios(
    idsAdmins,
    idPublicacion,
    `Nueva publicación pendiente de revisión: "${titulo}".`
  );
}
