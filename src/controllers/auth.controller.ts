import type { Request, Response } from "express";
import {
  actualizarPerfilSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema.js";
import {
  actualizarPerfil,
  iniciarSesion,
  registrar,
  restablecerContrasena,
  solicitarRestablecimiento,
} from "../services/auth.service.js";

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const resultado = await registrar(input);
  res.status(201).json(resultado);
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const resultado = await iniciarSesion(input);
  res.status(200).json(resultado);
}

export async function patchPerfil(req: Request, res: Response): Promise<void> {
  const input = actualizarPerfilSchema.parse(req.body);
  const archivo = req.file as Express.Multer.File | undefined;
  const usuario = await actualizarPerfil(req.user!.id_usuario, input, archivo);
  res.status(200).json(usuario);
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const input = forgotPasswordSchema.parse(req.body);
  await solicitarRestablecimiento(input);
  res.status(200).json({ message: "Si el correo existe, enviamos instrucciones para restablecer la contraseña" });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const input = resetPasswordSchema.parse(req.body);
  await restablecerContrasena(input);
  res.status(200).json({ message: "Contraseña actualizada correctamente" });
}
