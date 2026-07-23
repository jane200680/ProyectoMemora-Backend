import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import type { CrearComentarioInput } from "../schemas/interaccion.schema.js";
import type { ComentarioRow } from "../types/interaccion.js";

export async function listarComentarios(idPublicacion: number): Promise<ComentarioRow[]> {
  const [rows] = await pool.query<(ComentarioRow & RowDataPacket)[]>(
    `SELECT c.id_comentario, c.contenido, c.fecha_comentario, c.comentario_id_comentario,
            u.id_usuario, u.nombre, u.apellido, u.foto_perfil
     FROM comentario c
     JOIN usuario u ON u.id_usuario = c.id_usuario
     WHERE c.id_publicacion = ?
     ORDER BY c.fecha_comentario ASC`,
    [idPublicacion]
  );

  return rows;
}

export async function crearComentario(
  idUsuario: number,
  idPublicacion: number,
  input: CrearComentarioInput
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO comentario (contenido, id_usuario, id_publicacion, comentario_id_comentario)
     VALUES (?, ?, ?, ?)`,
    [input.contenido, idUsuario, idPublicacion, input.comentario_id_comentario ?? null]
  );

  return result.insertId;
}
