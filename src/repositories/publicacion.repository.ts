import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import type { CrearPublicacionInput } from "../schemas/publicacion.schema.js";
import type { PublicacionFeedRow } from "../types/publicacion.js";

export async function findFeedAprobado(
  limite: number,
  offset: number
): Promise<PublicacionFeedRow[]> {
  const [rows] = await pool.query<(PublicacionFeedRow & RowDataPacket)[]>(
    `SELECT
       p.id_publicacion,
       p.titulo,
       p.descripcion,
       p.tipo_contenido,
       p.fecha_publicacion,
       u.id_usuario,
       u.nombre,
       u.apellido,
       u.foto_perfil,
       (SELECT am.url_archivo FROM archivo_multimedia am
         WHERE am.id_publicacion = p.id_publicacion
         ORDER BY am.id_archivo ASC LIMIT 1) AS imagen,
       (SELECT COUNT(*) FROM comentario c
         WHERE c.id_publicacion = p.id_publicacion) AS total_comentarios
     FROM publicacion_cultural p
     JOIN usuario u ON u.id_usuario = p.id_usuario
     WHERE p.estado = 'Aprobada'
     ORDER BY p.fecha_publicacion DESC
     LIMIT ? OFFSET ?`,
    [limite, offset]
  );

  return rows;
}

export async function crearPublicacion(
  idUsuario: number,
  input: CrearPublicacionInput
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO publicacion_cultural (titulo, descripcion, tipo_contenido, anio_contenido, id_usuario)
     VALUES (?, ?, ?, ?, ?)`,
    [input.titulo, input.descripcion, input.tipo_contenido, input.anio_contenido ?? null, idUsuario]
  );

  return result.insertId;
}

export async function countFeedAprobado(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM publicacion_cultural WHERE estado = 'Aprobada'`
  );

  return Number(rows[0]?.total ?? 0);
}
