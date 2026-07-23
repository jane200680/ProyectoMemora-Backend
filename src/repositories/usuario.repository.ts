import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import type { EstadoUsuarioInput } from "../schemas/admin.schema.js";
import type { RegisterInput } from "../schemas/auth.schema.js";
import type { Usuario } from "../types/usuario.js";
import type { UsuarioConHash } from "../types/usuario.js";

export async function crearUsuario(
  input: RegisterInput,
  contrasenaHash: string
): Promise<number> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [usuarioResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO usuario (nombre_usuario, nombre, apellido, correo)
       VALUES (?, ?, ?, ?)`,
      [input.nombre_usuario, input.nombre, input.apellido, input.correo]
    );

    const idUsuario = usuarioResult.insertId;

    await connection.query(
      `INSERT INTO autenticacion (contrasena_hash, usuario_id_usuario)
       VALUES (?, ?)`,
      [contrasenaHash, idUsuario]
    );

    await connection.commit();
    return idUsuario;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function buscarPorCorreoConHash(correo: string): Promise<UsuarioConHash | null> {
  const [rows] = await pool.query<(UsuarioConHash & RowDataPacket)[]>(
    `SELECT u.id_usuario, u.nombre_usuario, u.nombre, u.apellido, u.correo,
            u.rol, u.estado, u.foto_perfil, a.contrasena_hash
     FROM usuario u
     JOIN autenticacion a ON a.usuario_id_usuario = u.id_usuario
     WHERE u.correo = ?
     LIMIT 1`,
    [correo]
  );

  return rows[0] ?? null;
}

export async function actualizarUltimoAcceso(idUsuario: number): Promise<void> {
  await pool.query(
    `UPDATE autenticacion SET ultimo_acceso = NOW() WHERE usuario_id_usuario = ?`,
    [idUsuario]
  );
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const [rows] = await pool.query<(Usuario & RowDataPacket)[]>(
    `SELECT id_usuario, nombre_usuario, nombre, apellido, correo, rol, estado, foto_perfil
     FROM usuario
     ORDER BY id_usuario DESC`
  );

  return rows;
}

export async function actualizarEstadoUsuario(
  idUsuario: number,
  input: EstadoUsuarioInput
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE usuario SET estado = ? WHERE id_usuario = ?`,
    [input.estado, idUsuario]
  );

  return result.affectedRows > 0;
}
