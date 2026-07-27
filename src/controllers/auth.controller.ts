import type { Request, Response } from "express";
import { actualizarPerfilSchema, loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { actualizarPerfil, iniciarSesion, registrar } from "../services/auth.service.js";

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
