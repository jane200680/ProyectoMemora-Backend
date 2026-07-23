import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import type { CategoriaInput } from "../schemas/admin.schema.js";
import type { CategoriaCultural } from "../types/catalogo.js";

export async function listarCategorias(): Promise<CategoriaCultural[]> {
  const [rows] = await pool.query<(CategoriaCultural & RowDataPacket)[]>(
    `SELECT id_categoria, nombre_categoria, descripcion, icono
     FROM categoria_cultural
     ORDER BY nombre_categoria ASC`
  );

  return rows;
}

export async function crearCategoria(input: CategoriaInput): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO categoria_cultural (nombre_categoria, descripcion, icono)
     VALUES (?, ?, ?)`,
    [input.nombre_categoria, input.descripcion ?? null, input.icono ?? null]
  );

  return result.insertId;
}

export async function actualizarCategoria(
  idCategoria: number,
  input: CategoriaInput
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE categoria_cultural SET nombre_categoria = ?, descripcion = ?, icono = ?
     WHERE id_categoria = ?`,
    [input.nombre_categoria, input.descripcion ?? null, input.icono ?? null, idCategoria]
  );

  return result.affectedRows > 0;
}

export async function eliminarCategoria(idCategoria: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM categoria_cultural WHERE id_categoria = ?`,
    [idCategoria]
  );

  return result.affectedRows > 0;
}
