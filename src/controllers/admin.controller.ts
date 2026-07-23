import type { Request, Response } from "express";
import { estadoPublicacionSchema, estadoUsuarioSchema } from "../schemas/admin.schema.js";
import {
  actualizarEstadoPublicacion,
  actualizarEstadoUsuario,
  listarPublicacionesPendientes,
  listarUsuarios,
} from "../services/admin.service.js";

export async function getUsuarios(req: Request, res: Response): Promise<void> {
  const usuarios = await listarUsuarios();
  res.json(usuarios);
}

export async function patchEstadoUsuario(req: Request, res: Response): Promise<void> {
  const input = estadoUsuarioSchema.parse(req.body);
  await actualizarEstadoUsuario(Number(req.params.id), input);
  res.json({ ok: true });
}

export async function getPublicacionesPendientes(req: Request, res: Response): Promise<void> {
  const publicaciones = await listarPublicacionesPendientes();
  res.json(publicaciones);
}

export async function patchEstadoPublicacion(req: Request, res: Response): Promise<void> {
  const input = estadoPublicacionSchema.parse(req.body);
  await actualizarEstadoPublicacion(Number(req.params.id), input);
  res.json({ ok: true });
}
