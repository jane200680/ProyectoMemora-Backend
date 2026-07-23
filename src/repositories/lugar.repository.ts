import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import type { LugarInput } from "../schemas/admin.schema.js";
import type { LugarCultural } from "../types/catalogo.js";

export async function listarLugares(): Promise<LugarCultural[]> {
  const [rows] = await pool.query<(LugarCultural & RowDataPacket)[]>(
    `SELECT id_lugar, nombre_lugar, descripcion, direccion_referencial, latitud, longitud
     FROM lugar_cultural
     ORDER BY nombre_lugar ASC`
  );

  return rows;
}

export async function crearLugar(input: LugarInput): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO lugar_cultural (nombre_lugar, descripcion, direccion_referencial, latitud, longitud)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.nombre_lugar,
      input.descripcion ?? null,
      input.direccion_referencial ?? null,
      input.latitud ?? null,
      input.longitud ?? null,
    ]
  );

  return result.insertId;
}

export async function actualizarLugar(idLugar: number, input: LugarInput): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE lugar_cultural
     SET nombre_lugar = ?, descripcion = ?, direccion_referencial = ?, latitud = ?, longitud = ?
     WHERE id_lugar = ?`,
    [
      input.nombre_lugar,
      input.descripcion ?? null,
      input.direccion_referencial ?? null,
      input.latitud ?? null,
      input.longitud ?? null,
      idLugar,
    ]
  );

  return result.affectedRows > 0;
}

export async function eliminarLugar(idLugar: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM lugar_cultural WHERE id_lugar = ?`,
    [idLugar]
  );

  return result.affectedRows > 0;
}
