import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import type { NotificacionRow } from "../types/notificacion.js";

export async function crearNotificacion(
  idUsuario: number,
  idPublicacion: number,
  mensaje: string
): Promise<void> {
  await pool.query<ResultSetHeader>(
    `INSERT INTO notificacion (mensaje, usuario_id_usuario, publicacion_cultural_id_publicacion)
     VALUES (?, ?, ?)`,
    [mensaje, idUsuario, idPublicacion]
  );
}

export async function crearNotificacionesParaUsuarios(
  idsUsuarios: number[],
  idPublicacion: number,
  mensaje: string
): Promise<void> {
  if (!idsUsuarios.length) return;

  await pool.query(
    `INSERT INTO notificacion (mensaje, usuario_id_usuario, publicacion_cultural_id_publicacion)
     VALUES ?`,
    [idsUsuarios.map((idUsuario) => [mensaje, idUsuario, idPublicacion])]
  );
}

export async function listarNotificaciones(idUsuario: number): Promise<NotificacionRow[]> {
  const [rows] = await pool.query<(NotificacionRow & RowDataPacket)[]>(
    `SELECT id_notificacion, mensaje, fecha_notificacion, leida, publicacion_cultural_id_publicacion
     FROM notificacion
     WHERE usuario_id_usuario = ?
     ORDER BY fecha_notificacion DESC
     LIMIT 50`,
    [idUsuario]
  );

  return rows;
}

export async function contarNoLeidas(idUsuario: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM notificacion WHERE usuario_id_usuario = ? AND leida = 0`,
    [idUsuario]
  );

  return Number(rows[0]?.total ?? 0);
}

export async function marcarLeida(idNotificacion: number, idUsuario: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE notificacion SET leida = 1 WHERE id_notificacion = ? AND usuario_id_usuario = ?`,
    [idNotificacion, idUsuario]
  );

  return result.affectedRows > 0;
}

export async function marcarTodasLeidas(idUsuario: number): Promise<void> {
  await pool.query(`UPDATE notificacion SET leida = 1 WHERE usuario_id_usuario = ? AND leida = 0`, [
    idUsuario,
  ]);
}

export async function eliminarNotificacion(idNotificacion: number, idUsuario: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM notificacion WHERE id_notificacion = ? AND usuario_id_usuario = ?`,
    [idNotificacion, idUsuario]
  );

  return result.affectedRows > 0;
}

export async function eliminarTodasNotificaciones(idUsuario: number): Promise<void> {
  await pool.query(`DELETE FROM notificacion WHERE usuario_id_usuario = ?`, [idUsuario]);
}
