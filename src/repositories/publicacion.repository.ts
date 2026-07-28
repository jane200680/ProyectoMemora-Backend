import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import type { EstadoPublicacionInput } from "../schemas/admin.schema.js";
import type {
  CrearPublicacionInput,
  EditarPublicacionInput,
  FeedQueryInput,
} from "../schemas/publicacion.schema.js";
import type {
  ArchivoMultimediaInput,
  ArchivoMultimediaRow,
  PublicacionFeedRow,
} from "../types/publicacion.js";

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
       (SELECT GROUP_CONCAT(am.url_archivo ORDER BY am.id_archivo ASC SEPARATOR '||')
         FROM archivo_multimedia am
         WHERE am.id_publicacion = p.id_publicacion AND am.tipo_archivo = 'Imagen') AS imagenes,
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

export interface DetallePublicacion {
  id_publicacion: number;
  id_usuario: number;
  titulo: string;
  descripcion: string;
  tipo_contenido: string;
  anio_contenido: number | null;
  categorias: number[];
  lugares: number[];
  archivos: ArchivoMultimediaRow[];
}

export async function obtenerDetallePublicacion(
  idPublicacion: number
): Promise<DetallePublicacion | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id_publicacion, id_usuario, titulo, descripcion, tipo_contenido, anio_contenido
     FROM publicacion_cultural WHERE id_publicacion = ?`,
    [idPublicacion]
  );

  const fila = rows[0];
  if (!fila) return null;

  const [categoriaRows] = await pool.query<RowDataPacket[]>(
    `SELECT categoria_cultural_id_categoria AS id FROM publicacion_cultural_has_categoria_cultural
     WHERE publicacion_cultural_id_publicacion = ?`,
    [idPublicacion]
  );

  const [lugarRows] = await pool.query<RowDataPacket[]>(
    `SELECT lugar_cultural_id_lugar AS id FROM publicacion_cultural_has_lugar_cultural
     WHERE publicacion_cultural_id_publicacion = ?`,
    [idPublicacion]
  );

  const [archivoRows] = await pool.query<(ArchivoMultimediaRow & RowDataPacket)[]>(
    `SELECT id_archivo, tipo_archivo, url_archivo FROM archivo_multimedia
     WHERE id_publicacion = ? ORDER BY id_archivo ASC`,
    [idPublicacion]
  );

  return {
    id_publicacion: fila.id_publicacion,
    id_usuario: fila.id_usuario,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    tipo_contenido: fila.tipo_contenido,
    anio_contenido: fila.anio_contenido,
    categorias: categoriaRows.map((fila) => fila.id as number),
    lugares: lugarRows.map((fila) => fila.id as number),
    archivos: archivoRows,
  };
}

export async function actualizarPublicacion(
  idPublicacion: number,
  input: EditarPublicacionInput,
  archivosNuevos: ArchivoMultimediaInput[] = []
): Promise<void> {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    await conexion.query(
      `UPDATE publicacion_cultural
       SET titulo = ?, descripcion = ?, tipo_contenido = ?, anio_contenido = ?, estado = 'Pendiente'
       WHERE id_publicacion = ?`,
      [input.titulo, input.descripcion, input.tipo_contenido, input.anio_contenido ?? null, idPublicacion]
    );

    await conexion.query(
      `DELETE FROM publicacion_cultural_has_categoria_cultural
       WHERE publicacion_cultural_id_publicacion = ?`,
      [idPublicacion]
    );

    if (input.categorias.length) {
      await conexion.query(
        `INSERT INTO publicacion_cultural_has_categoria_cultural
           (publicacion_cultural_id_publicacion, categoria_cultural_id_categoria)
         VALUES ?`,
        [input.categorias.map((idCategoria) => [idPublicacion, idCategoria])]
      );
    }

    await conexion.query(
      `DELETE FROM publicacion_cultural_has_lugar_cultural
       WHERE publicacion_cultural_id_publicacion = ?`,
      [idPublicacion]
    );

    if (input.lugares.length) {
      await conexion.query(
        `INSERT INTO publicacion_cultural_has_lugar_cultural
           (publicacion_cultural_id_publicacion, lugar_cultural_id_lugar)
         VALUES ?`,
        [input.lugares.map((idLugar) => [idPublicacion, idLugar])]
      );
    }

    if (input.archivos_eliminar.length) {
      await conexion.query(
        `DELETE FROM archivo_multimedia
         WHERE id_publicacion = ? AND id_archivo IN (?)`,
        [idPublicacion, input.archivos_eliminar]
      );
    }

    if (archivosNuevos.length) {
      await conexion.query(
        `INSERT INTO archivo_multimedia (tipo_archivo, url_archivo, id_publicacion)
         VALUES ?`,
        [archivosNuevos.map((archivo) => [archivo.tipo_archivo, archivo.url_archivo, idPublicacion])]
      );
    }

    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function obtenerAutorPublicacion(
  idPublicacion: number
): Promise<{ id_usuario: number; titulo: string } | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id_usuario, titulo FROM publicacion_cultural WHERE id_publicacion = ?`,
    [idPublicacion]
  );

  return (rows[0] as { id_usuario: number; titulo: string } | undefined) ?? null;
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

export async function eliminarPublicacion(idPublicacion: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM publicacion_cultural WHERE id_publicacion = ?`,
    [idPublicacion]
  );

  return result.affectedRows > 0;
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
