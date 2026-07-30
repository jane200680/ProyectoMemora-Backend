import { env } from "../config/env.js";
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
  buscarPorId,
  listarAdministradores,
  obtenerNombreUsuario,
} from "../repositories/usuario.repository.js";
import { enviarCorreoNotificacion } from "./mail.service.js";

function avisarPorCorreo(correo: string, nombre: string, mensaje: string, enlace: string) {
  enviarCorreoNotificacion(correo, nombre, mensaje, enlace).catch((error) => {
    console.error(`No se pudo enviar el correo de notificación a ${correo}:`, error);
  });
}

export type TipoNotificacion = "comentario" | "reaccion" | "estado" | "pendiente" | "otro";

export interface NotificacionDTO {
  id: number;
  mensaje: string;
  fecha: string;
  leida: boolean;
  idPublicacion: number;
  tipo: TipoNotificacion;
}

function inferirTipoNotificacion(mensaje: string): TipoNotificacion {
  if (mensaje.includes("comentó tu publicación")) return "comentario";
  if (mensaje.includes("reaccionó a tu publicación")) return "reaccion";
  if (mensaje.includes("fue aprobada") || mensaje.includes("fue rechazada")) return "estado";
  if (mensaje.includes("pendiente de revisión")) return "pendiente";
  return "otro";
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
    tipo: inferirTipoNotificacion(fila.mensaje),
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

  const usuario = await buscarPorId(publicacion.id_usuario);
  if (usuario) {
    avisarPorCorreo(usuario.correo, usuario.nombre, mensaje, `${env.frontendUrl}/notificaciones`);
  }
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
  const mensaje = `${nombreActor} ${accion} tu publicación "${publicacion.titulo}".`;

  await crearNotificacion(publicacion.id_usuario, idPublicacion, mensaje);

  const usuario = await buscarPorId(publicacion.id_usuario);
  if (usuario) {
    avisarPorCorreo(usuario.correo, usuario.nombre, mensaje, `${env.frontendUrl}/notificaciones`);
  }
}

export async function notificarAdminsPublicacionPendiente(
  idPublicacion: number,
  titulo: string
) {
  const admins = await listarAdministradores();
  if (!admins.length) return;

  const mensaje = `Nueva publicación pendiente de revisión: "${titulo}".`;

  await crearNotificacionesParaUsuarios(
    admins.map((admin) => admin.id_usuario),
    idPublicacion,
    mensaje
  );

  for (const admin of admins) {
    avisarPorCorreo(admin.correo, admin.nombre, mensaje, `${env.frontendUrl}/admin`);
  }
}
