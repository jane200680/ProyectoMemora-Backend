import { pool } from '../config/database.js';
import { LoginDTO, RegisterDTO } from '../schemas/auth.schema.js';

export interface UsuarioRegistro extends RegisterDTO {
  id_usuario: number;
  rol: 'Administrador' | 'Usuario';
}

export interface UsuarioAutenticado {
  id_usuario: number;
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: 'Administrador' | 'Usuario';
  contrasena_hash: string;
}

export const AuthRepository = {
  async findByEmail(correo: string) {
    const [rows] = await pool.execute(
      `SELECT
         u.id_usuario,
         u.nombre_usuario,
         u.nombre,
         u.apellido,
         u.correo,
         u.rol,
         a.contrasena_hash
       FROM usuario u
       INNER JOIN autenticacion a ON u.id_usuario = a.usuario_id_usuario
       WHERE u.correo = ?`,
      [correo]
    );

    return (rows as any[])[0] as UsuarioAutenticado | undefined;
  },

  async findByUserName(nombre_usuario: string) {
    const [rows] = await pool.execute(
      `SELECT id_usuario FROM usuario WHERE nombre_usuario = ?`,
      [nombre_usuario]
    );
    return (rows as any[])[0] as { id_usuario: number } | undefined;
  },

  async createUser(data: RegisterDTO, hash: string) {
    const [result] = await pool.execute(
      `INSERT INTO usuario (nombre_usuario, nombre, apellido, correo, rol)
       VALUES (?, ?, ?, ?, 'Usuario')`,
      [data.nombre_usuario, data.nombre, data.apellido, data.correo]
    );

    const insertId = (result as any).insertId;
    await pool.execute(
      `INSERT INTO autenticacion (contrasena_hash, usuario_id_usuario)
       VALUES (?, ?)`,
      [hash, insertId]
    );

    return {
      id_usuario: insertId,
      ...data,
      rol: 'Usuario',
    } as UsuarioRegistro;
  },
};