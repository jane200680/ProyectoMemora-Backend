import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/errorHandler.js";
import {
  actualizarContrasena,
  actualizarPerfil as actualizarPerfilRepo,
  actualizarUltimoAcceso,
  buscarPorCorreo,
  buscarPorCorreoConHash,
  buscarPorGoogleId,
  buscarPorId,
  crearUsuario,
  vincularGoogleId,
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

async function crearUsuarioConReintento(
  datosBase: { nombre: string; apellido: string; correo: string },
  contrasenaHash: string | null,
  googleId?: string
): Promise<number> {
  for (let intento = 0; intento < INTENTOS_NOMBRE_USUARIO; intento++) {
    const nombreUsuario = generarNombreUsuario(datosBase.correo);

    try {
      return await crearUsuario(
        { nombre_usuario: nombreUsuario, ...datosBase },
        contrasenaHash,
        googleId
      );
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

function firmarToken(usuario: Usuario): string {
  return jwt.sign({ id_usuario: usuario.id_usuario, rol: usuario.rol }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as jwt.SignOptions);
}

export async function registrar(input: RegisterInput): Promise<{ id_usuario: number }> {
  const contrasenaHash = await bcrypt.hash(input.contrasena, SALT_ROUNDS);
  const idUsuario = await crearUsuarioConReintento(input, contrasenaHash);
  return { id_usuario: idUsuario };
}

export async function iniciarSesion(input: LoginInput): Promise<{ token: string; usuario: Usuario }> {
  const usuarioConHash = await buscarPorCorreoConHash(input.correo);

  if (!usuarioConHash) {
    throw new HttpError(401, "Correo o contraseña incorrectos");
  }

  if (!usuarioConHash.contrasena_hash) {
    throw new HttpError(
      401,
      "Esta cuenta inicia sesión con Google. Usa el botón 'Continuar con Google'."
    );
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

  const token = firmarToken(usuario);

  return { token, usuario };
}

const googleClient = new OAuth2Client(env.google.clientId);

export async function iniciarSesionGoogle(idToken: string): Promise<{ token: string; usuario: Usuario }> {
  if (!env.google.clientId) {
    throw new HttpError(500, "El inicio de sesión con Google no está configurado");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.google.clientId });
    payload = ticket.getPayload();
  } catch {
    throw new HttpError(401, "Token de Google inválido o expirado");
  }

  if (!payload?.email || !payload.sub) {
    throw new HttpError(401, "Token de Google inválido");
  }
  if (!payload.email_verified) {
    throw new HttpError(401, "El correo de tu cuenta de Google no está verificado");
  }

  let usuario = await buscarPorGoogleId(payload.sub);

  if (!usuario) {
    const usuarioExistente = await buscarPorCorreo(payload.email);

    if (usuarioExistente) {
      await vincularGoogleId(usuarioExistente.id_usuario, payload.sub);
      usuario = usuarioExistente;
    } else {
      const idUsuario = await crearUsuarioConReintento(
        {
          nombre: payload.given_name ?? payload.name ?? "Usuario",
          apellido: payload.family_name ?? "Memora",
          correo: payload.email,
        },
        null,
        payload.sub
      );
      usuario = await buscarPorId(idUsuario);
    }
  }

  if (!usuario) {
    throw new HttpError(500, "No se pudo completar el inicio de sesión con Google");
  }

  if (usuario.estado !== "Activo") {
    throw new HttpError(403, "Tu cuenta no está activa. Contacta al administrador");
  }

  await actualizarUltimoAcceso(usuario.id_usuario);

  const token = firmarToken(usuario);

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
