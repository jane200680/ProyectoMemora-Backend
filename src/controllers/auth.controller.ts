import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { iniciarSesion, registrar } from "../services/auth.service.js";

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
