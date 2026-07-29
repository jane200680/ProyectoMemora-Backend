import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/errorHandler.js";
import {
  actualizarContrasena,
  actualizarPerfil as actualizarPerfilRepo,
  actualizarUltimoAcceso,
  buscarPorCorreoConHash,
  buscarPorId,
  crearUsuario,
} from "../repositories/usuario.repository.js";
import {
  buscarRestablecimientoValido,
  crearRestablecimiento,
  marcarRestablecimientoUsado,
} from "../repositories/restablecimiento.repository.js";
import { enviarCorreoRecuperacion } from "./mail.service.js";
import type {
  ActualizarPerfilInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "../schemas/auth.schema.js";
import type { Usuario } from "../types/usuario.js";
import { subirArchivoS3 } from "./s3.service.js";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const SALT_ROUNDS = 10;

interface MysqlError {
  code?: string;
}

interface MysqlErrorConDetalle extends MysqlError {
  sqlMessage?: string;
}

function esErrorDeDuplicado(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as MysqlError).code === "ER_DUP_ENTRY";
}

function esConflictoDeNombreUsuario(error: unknown): boolean {
  if (!esErrorDeDuplicado(error)) return false;
  return Boolean((error as MysqlErrorConDetalle).sqlMessage?.includes("nombre_usuario"));
}

function generarNombreUsuario(correo: string): string {
  const base =
    correo
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20) || "usuario";
  const sufijo = Math.floor(1000 + Math.random() * 9000);
  return `${base}${sufijo}`;
}

const INTENTOS_NOMBRE_USUARIO = 5;

export async function registrar(input: RegisterInput): Promise<{ id_usuario: number }> {
  const contrasenaHash = await bcrypt.hash(input.contrasena, SALT_ROUNDS);

  for (let intento = 0; intento < INTENTOS_NOMBRE_USUARIO; intento++) {
    const nombreUsuario = generarNombreUsuario(input.correo);

    try {
      const idUsuario = await crearUsuario(
        { nombre_usuario: nombreUsuario, nombre: input.nombre, apellido: input.apellido, correo: input.correo },
        contrasenaHash
      );
      return { id_usuario: idUsuario };
    } catch (error) {
      if (esConflictoDeNombreUsuario(error)) continue;
      if (esErrorDeDuplicado(error)) {
        throw new HttpError(409, "Ese correo ya está registrado");
      }
      throw error;
    }
  }

  throw new HttpError(500, "No se pudo completar el registro. Intenta de nuevo.");
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
  input: ActualizarPerfilInput,
  archivoFotoPerfil?: Express.Multer.File
): Promise<Usuario> {
  let fotoPerfilUrl: string | undefined;
  if (archivoFotoPerfil) {
    fotoPerfilUrl = await subirArchivoS3(archivoFotoPerfil, "perfiles");
  }

  try {
    await actualizarPerfilRepo(idUsuario, input, fotoPerfilUrl);
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

export async function solicitarRestablecimiento(input: ForgotPasswordInput): Promise<void> {
  const usuario = await buscarPorCorreoConHash(input.correo);
  if (!usuario) {
    return;
  }

  const tokenCrudo = crypto.randomBytes(32).toString("hex");
  const fechaExpiracion = new Date(Date.now() + 60 * 60 * 1000);

  await crearRestablecimiento(usuario.id_usuario, hashToken(tokenCrudo), fechaExpiracion);

  const enlace = `${env.frontendUrl}/reset-password?token=${tokenCrudo}`;
  await enviarCorreoRecuperacion(usuario.correo, usuario.nombre, enlace);
}

export async function restablecerContrasena(input: ResetPasswordInput): Promise<void> {
  const restablecimiento = await buscarRestablecimientoValido(hashToken(input.token));
  if (!restablecimiento) {
    throw new HttpError(400, "El enlace no es válido o ya expiró");
  }

  const contrasenaHash = await bcrypt.hash(input.contrasena, SALT_ROUNDS);
  await actualizarContrasena(restablecimiento.idUsuario, contrasenaHash);
  await marcarRestablecimientoUsado(restablecimiento.idRestablecimiento);
}
