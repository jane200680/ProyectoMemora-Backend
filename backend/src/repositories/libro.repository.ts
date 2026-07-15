import { pool } from '../config/database.js';
import { CrearLibroDTO, ActualizarLibroDTO } from '../schemas/libro.schema.js';

const BASE_QUERY = `
  SELECT
    l.id_publicacion AS id,
    l.titulo,
    l.descripcion AS isbn,
    l.tipo_contenido AS precio,
    l.estado AS stock,
    l.anio_contenido AS paginas,
    l.fecha_publicacion AS publicado_en,
    l.id_usuario AS autor_id,
    l.id_usuario AS categoria_id
  FROM publicacion_cultural l
`;

export async function findAll() {
  const [rows] = await pool.query(BASE_QUERY + ' ORDER BY l.id_publicacion');
  return rows as any[];
}

export async function findById(id: number) {
  const [rows] = (await pool.query(
    BASE_QUERY + ' WHERE l.id_publicacion = ?',
    [id]
  )) as [any[], any];
  return rows[0] ?? null;
}

export async function create(data: CrearLibroDTO) {
  const [result] = (await pool.query(
    `INSERT INTO publicacion_cultural
       (titulo, descripcion, tipo_contenido, id_usuario, anio_contenido)
     VALUES (?, ?, ?, ?, ?)`,
    [data.titulo, data.isbn, data.precio, data.autor_id, data.categoria_id]
  )) as [any, any];
  return findById(result.insertId);
}

export async function update(id: number, data: ActualizarLibroDTO) {
  const entradas = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entradas.length === 0) return findById(id);

  const sets = entradas.map(([k]) => `${k} = ?`).join(', ');
  const valores = entradas.map(([, v]) => v);

  await pool.query(`UPDATE publicacion_cultural SET ${sets} WHERE id_publicacion = ?`, [...valores, id]);
  return findById(id);
}

export async function remove(id: number) {
  await pool.query('DELETE FROM publicacion_cultural WHERE id_publicacion = ?', [id]);
}
