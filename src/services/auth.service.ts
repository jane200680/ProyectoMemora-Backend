import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/errorHandler.js";
import {
  actualizarPerfil as actualizarPerfilRepo,
  actualizarUltimoAcceso,
  buscarPorCorreoConHash,
  buscarPorId,
  crearUsuario,
} from "../repositories/usuario.repository.js";
import type { ActualizarPerfilInput, LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import type { Usuario } from "../types/usuario.js";

const SALT_ROUNDS = 10;

interface MysqlError {
  code?: string;
}

function esErrorDeDuplicado(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as MysqlError).code === "ER_DUP_ENTRY";
}

export async function registrar(input: RegisterInput): Promise<{ id_usuario: number }> {
  const contrasenaHash = await bcrypt.hash(input.contrasena, SALT_ROUNDS);

  try {
    const idUsuario = await crearUsuario(input, contrasenaHash);
    return { id_usuario: idUsuario };
  } catch (error) {
    if (esErrorDeDuplicado(error)) {
      throw new HttpError(409, "El correo o nombre de usuario ya está registrado");
    }
    throw error;
  }
}

export async function iniciarSesion(input: LoginInput): Promise<{ token: string; usuario: Usuario }> {
  const usuarioConHash = await buscarPorCorreoConHash(input.correo);

  if (!usuarioConHash) {
    throw new HttpError(401, "Correo o contraseña incorrectos");
  }

  const contrasenaValida = await bcrypt.compare(input.contrasena, usuarioConHash.contrasena_hash);
  if (!contrasenaValida) {
    throw new HttpError(401, "Correo o contraseña incorrectos");
  }

  if (usuarioConHash.estado !== "Activo") {
    throw new HttpError(403, "Tu cuenta no está activa. Contacta al administrador");
  }

  await actualizarUltimoAcceso(usuarioConHash.id_usuario);

  const { contrasena_hash: _contrasenaHash, ...usuario } = usuarioConHash;

  const token = jwt.sign({ id_usuario: usuario.id_usuario, rol: usuario.rol }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as jwt.SignOptions);

  return { token, usuario };
}

export async function actualizarPerfil(
  idUsuario: number,
  input: ActualizarPerfilInput
): Promise<Usuario> {
  try {
    await actualizarPerfilRepo(idUsuario, input);
  } catch (error) {
    if (esErrorDeDuplicado(error)) {
      throw new HttpError(409, "El nombre de usuario ya está en uso");
    }
    throw error;
  }

  const usuario = await buscarPorId(idUsuario);
  if (!usuario) {
    throw new HttpError(404, "Usuario no encontrado");
  }

  return usuario;
}
