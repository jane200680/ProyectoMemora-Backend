import { pool } from '../config/database.js';
import { CreatePublicacionDTO, UpdatePublicacionDTO } from '../schemas/publicacion.schema.js';

const BASE_QUERY = `
  SELECT
    l.id_publicacion AS id,
    l.titulo,
    l.descripcion,
    l.fecha_publicacion,
    l.tipo_contenido,
    l.estado,
    l.id_usuario AS autor_id,
    l.anio_contenido
  FROM publicacion_cultural l
`;

export const PublicacionRepository = {
  async findAll() {
    const [rows] = await pool.query(BASE_QUERY + ' ORDER BY l.id_publicacion');
    return rows as any[];
  },

  async findById(id: number) {
    const [rows] = (await pool.query(
      BASE_QUERY + ' WHERE l.id_publicacion = ?',
      [id]
    )) as [any[], any];
    return rows[0] ?? null;
  },

  async create(data: CreatePublicacionDTO & { id_usuario: number }) {
    const [result] = (await pool.query(
      `INSERT INTO publicacion_cultural
         (titulo, descripcion, tipo_contenido, id_usuario, anio_contenido)
       VALUES (?, ?, ?, ?, ?)`,
      [data.titulo, data.descripcion, data.tipo_contenido, data.id_usuario, data.anio_contenido ?? null]
    )) as [any, any];

    return this.findById(result.insertId);
  },

  async update(id: number, data: UpdatePublicacionDTO) {
    const entradas = Object.entries(data).filter(([, v]) => v !== undefined);
    if (entradas.length === 0) return this.findById(id);

    const sets = entradas.map(([k]) => `${k} = ?`).join(', ');
    const valores = entradas.map(([, v]) => v);

    await pool.query(`UPDATE publicacion_cultural SET ${sets} WHERE id_publicacion = ?`, [...valores, id]);
    return this.findById(id);
  },

  async remove(id: number) {
    await pool.query('DELETE FROM publicacion_cultural WHERE id_publicacion = ?', [id]);
  },
};