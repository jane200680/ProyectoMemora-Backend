import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import type { EstadoPublicacionInput } from "../schemas/admin.schema.js";
import type { CrearPublicacionInput, FeedQueryInput } from "../schemas/publicacion.schema.js";
import type { ArchivoMultimediaInput, PublicacionFeedRow } from "../types/publicacion.js";

export type FeedFiltros = Pick<FeedQueryInput, "tipo_contenido" | "categoria" | "lugar" | "anio" | "q">;

function construirFiltrosFeed(filtros: FeedFiltros) {
  const condiciones: string[] = [];
  const parametros: (string | number)[] = [];

  if (filtros.tipo_contenido) {
    condiciones.push("p.tipo_contenido = ?");
    parametros.push(filtros.tipo_contenido);
  }

  if (filtros.anio) {
    condiciones.push("p.anio_contenido = ?");
    parametros.push(filtros.anio);
  }

  if (filtros.categoria) {
    condiciones.push(
      `EXISTS (SELECT 1 FROM publicacion_cultural_has_categoria_cultural pc
         WHERE pc.publicacion_cultural_id_publicacion = p.id_publicacion
           AND pc.categoria_cultural_id_categoria = ?)`
    );
    parametros.push(filtros.categoria);
  }

  if (filtros.lugar) {
    condiciones.push(
      `EXISTS (SELECT 1 FROM publicacion_cultural_has_lugar_cultural pl
         WHERE pl.publicacion_cultural_id_publicacion = p.id_publicacion
           AND pl.lugar_cultural_id_lugar = ?)`
    );
    parametros.push(filtros.lugar);
  }

  if (filtros.q) {
    condiciones.push("(p.titulo LIKE ? OR p.descripcion LIKE ?)");
    const patron = `%${filtros.q}%`;
    parametros.push(patron, patron);
  }

  return { condiciones, parametros };
}

export async function findFeedAprobado(
  limite: number,
  offset: number,
  idUsuarioActual: number | null,
  filtros: FeedFiltros = {}
): Promise<PublicacionFeedRow[]> {
  const { condiciones, parametros } = construirFiltrosFeed(filtros);
  const whereExtra = condiciones.length ? ` AND ${condiciones.join(" AND ")}` : "";

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
         WHERE c.id_publicacion = p.id_publicacion) AS total_comentarios,
       (SELECT COUNT(*) FROM reaccion r
         WHERE r.id_publicacion = p.id_publicacion) AS total_reacciones,
       EXISTS(
         SELECT 1 FROM reaccion r
         WHERE r.id_publicacion = p.id_publicacion AND r.id_usuario = ?
       ) AS reacciono
     FROM publicacion_cultural p
     JOIN usuario u ON u.id_usuario = p.id_usuario
     WHERE p.estado = 'Aprobada'${whereExtra}
     ORDER BY p.fecha_publicacion DESC
     LIMIT ? OFFSET ?`,
    [idUsuarioActual, ...parametros, limite, offset]
  );

  return rows;
}

export async function crearPublicacion(
  idUsuario: number,
  input: CrearPublicacionInput,
  archivos: ArchivoMultimediaInput[] = []
): Promise<number> {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [result] = await conexion.query<ResultSetHeader>(
      `INSERT INTO publicacion_cultural (titulo, descripcion, tipo_contenido, anio_contenido, id_usuario)
       VALUES (?, ?, ?, ?, ?)`,
      [input.titulo, input.descripcion, input.tipo_contenido, input.anio_contenido ?? null, idUsuario]
    );

    const idPublicacion = result.insertId;

    if (input.categorias?.length) {
      await conexion.query(
        `INSERT INTO publicacion_cultural_has_categoria_cultural
           (publicacion_cultural_id_publicacion, categoria_cultural_id_categoria)
         VALUES ?`,
        [input.categorias.map((idCategoria) => [idPublicacion, idCategoria])]
      );
    }

    if (input.lugares?.length) {
      await conexion.query(
        `INSERT INTO publicacion_cultural_has_lugar_cultural
           (publicacion_cultural_id_publicacion, lugar_cultural_id_lugar)
         VALUES ?`,
        [input.lugares.map((idLugar) => [idPublicacion, idLugar])]
      );
    }

    if (archivos.length) {
      await conexion.query(
        `INSERT INTO archivo_multimedia (tipo_archivo, url_archivo, id_publicacion)
         VALUES ?`,
        [archivos.map((archivo) => [archivo.tipo_archivo, archivo.url_archivo, idPublicacion])]
      );
    }

    await conexion.commit();
    return idPublicacion;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function countFeedAprobado(filtros: FeedFiltros = {}): Promise<number> {
  const { condiciones, parametros } = construirFiltrosFeed(filtros);
  const whereExtra = condiciones.length ? ` AND ${condiciones.join(" AND ")}` : "";

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM publicacion_cultural p WHERE p.estado = 'Aprobada'${whereExtra}`,
    parametros
  );

  return Number(rows[0]?.total ?? 0);
}

export async function findPendientes(): Promise<PublicacionFeedRow[]> {
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
     WHERE p.estado = 'Pendiente'
     ORDER BY p.fecha_publicacion ASC`
  );

  return rows;
}

export async function actualizarEstadoPublicacion(
  idPublicacion: number,
  input: EstadoPublicacionInput
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE publicacion_cultural SET estado = ? WHERE id_publicacion = ?`,
    [input.estado, idPublicacion]
  );

  return result.affectedRows > 0;
}
