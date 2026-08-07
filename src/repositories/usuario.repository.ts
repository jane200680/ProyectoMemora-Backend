import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import type { EstadoUsuarioInput } from "../schemas/admin.schema.js";
import type { ActualizarPerfilInput } from "../schemas/auth.schema.js";
import type { Usuario } from "../types/usuario.js";
import type { UsuarioConHash } from "../types/usuario.js";

export interface NuevoUsuarioInput {
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
}

export async function crearUsuario(
  input: NuevoUsuarioInput,
  contrasenaHash: string | null,
  googleId?: string
): Promise<number> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [usuarioResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO usuario (nombre_usuario, nombre, apellido, correo, google_id)
       VALUES (?, ?, ?, ?, ?)`,
      [input.nombre_usuario, input.nombre, input.apellido, input.correo, googleId ?? null]
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

export async function buscarPorCorreo(correo: string): Promise<Usuario | null> {
  const [rows] = await pool.query<(Usuario & RowDataPacket)[]>(
    `SELECT id_usuario, nombre_usuario, nombre, apellido, correo, rol, estado, foto_perfil
     FROM usuario
     WHERE correo = ?
     LIMIT 1`,
    [correo]
  );

  return rows[0] ?? null;
}

export async function buscarPorGoogleId(googleId: string): Promise<Usuario | null> {
  const [rows] = await pool.query<(Usuario & RowDataPacket)[]>(
    `SELECT id_usuario, nombre_usuario, nombre, apellido, correo, rol, estado, foto_perfil
     FROM usuario
     WHERE google_id = ?
     LIMIT 1`,
    [googleId]
  );

  return rows[0] ?? null;
}

export async function vincularGoogleId(idUsuario: number, googleId: string): Promise<void> {
  await pool.query(`UPDATE usuario SET google_id = ? WHERE id_usuario = ?`, [googleId, idUsuario]);
}

export async function actualizarUltimoAcceso(idUsuario: number): Promise<void> {
  await pool.query(
    `UPDATE autenticacion SET ultimo_acceso = NOW() WHERE usuario_id_usuario = ?`,
    [idUsuario]
  );
}

export async function actualizarContrasena(
  idUsuario: number,
  contrasenaHash: string
): Promise<void> {
  await pool.query(
    `UPDATE autenticacion SET contrasena_hash = ?, fecha_actualizacion = NOW()
     WHERE usuario_id_usuario = ?`,
    [contrasenaHash, idUsuario]
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

export async function obtenerNombreUsuario(
  idUsuario: number
): Promise<{ nombre: string; apellido: string } | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT nombre, apellido FROM usuario WHERE id_usuario = ?`,
    [idUsuario]
  );

  return (rows[0] as { nombre: string; apellido: string } | undefined) ?? null;
}

export async function buscarPorId(idUsuario: number): Promise<Usuario | null> {
  const [rows] = await pool.query<(Usuario & RowDataPacket)[]>(
    `SELECT id_usuario, nombre_usuario, nombre, apellido, correo, rol, estado, foto_perfil
     FROM usuario
     WHERE id_usuario = ?
     LIMIT 1`,
    [idUsuario]
  );

  return rows[0] ?? null;
}

export async function actualizarPerfil(
  idUsuario: number,
  input: ActualizarPerfilInput,
  fotoPerfil?: string
): Promise<boolean> {
  const campos = ["nombre_usuario = ?", "nombre = ?", "apellido = ?"];
  const valores: (string | number)[] = [input.nombre_usuario, input.nombre, input.apellido];

  if (fotoPerfil) {
    campos.push("foto_perfil = ?");
    valores.push(fotoPerfil);
  }

  valores.push(idUsuario);

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE usuario SET ${campos.join(", ")} WHERE id_usuario = ?`,
    valores
  );

  return result.affectedRows > 0;
}

export async function listarAdministradores(): Promise<
  { id_usuario: number; correo: string; nombre: string }[]
> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id_usuario, correo, nombre FROM usuario WHERE rol = 'Administrador' AND estado = 'Activo'`
  );

  return rows as { id_usuario: number; correo: string; nombre: string }[];
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
