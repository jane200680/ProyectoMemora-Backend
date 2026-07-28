import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";

interface RestablecimientoRow extends RowDataPacket {
  id_restablecimiento: number;
  usuario_id_usuario: number;
  fecha_expiracion: Date;
  usado: number;
}

export async function crearRestablecimiento(
  idUsuario: number,
  tokenHash: string,
  fechaExpiracion: Date
): Promise<void> {
  await pool.query(
    `DELETE FROM restablecimiento_contrasena WHERE usuario_id_usuario = ?`,
    [idUsuario]
  );

  await pool.query(
    `INSERT INTO restablecimiento_contrasena (token_hash, usuario_id_usuario, fecha_expiracion)
     VALUES (?, ?, ?)`,
    [tokenHash, idUsuario, fechaExpiracion]
  );
}

export async function buscarRestablecimientoValido(
  tokenHash: string
): Promise<{ idRestablecimiento: number; idUsuario: number } | null> {
  const [rows] = await pool.query<RestablecimientoRow[]>(
    `SELECT id_restablecimiento, usuario_id_usuario, fecha_expiracion, usado
     FROM restablecimiento_contrasena
     WHERE token_hash = ? AND usado = 0 AND fecha_expiracion > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  const fila = rows[0];
  if (!fila) return null;

  return { idRestablecimiento: fila.id_restablecimiento, idUsuario: fila.usuario_id_usuario };
}

export async function marcarRestablecimientoUsado(idRestablecimiento: number): Promise<void> {
  await pool.query<ResultSetHeader>(
    `UPDATE restablecimiento_contrasena SET usado = 1 WHERE id_restablecimiento = ?`,
    [idRestablecimiento]
  );
}
