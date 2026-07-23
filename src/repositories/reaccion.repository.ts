import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";

export async function existeReaccion(idUsuario: number, idPublicacion: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id_reaccion FROM reaccion WHERE id_usuario = ? AND id_publicacion = ? LIMIT 1`,
    [idUsuario, idPublicacion]
  );

  return rows.length > 0;
}

export async function crearReaccion(idUsuario: number, idPublicacion: number): Promise<void> {
  await pool.query<ResultSetHeader>(
    `INSERT INTO reaccion (id_usuario, id_publicacion) VALUES (?, ?)`,
    [idUsuario, idPublicacion]
  );
}

export async function eliminarReaccion(idUsuario: number, idPublicacion: number): Promise<void> {
  await pool.query<ResultSetHeader>(
    `DELETE FROM reaccion WHERE id_usuario = ? AND id_publicacion = ?`,
    [idUsuario, idPublicacion]
  );
}

export async function contarReacciones(idPublicacion: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM reaccion WHERE id_publicacion = ?`,
    [idPublicacion]
  );

  return Number(rows[0]?.total ?? 0);
}
