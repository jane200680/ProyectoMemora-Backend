import type { Request, Response } from "express";
import {
  eliminarComentarioAdminSchema,
  eliminarPublicacionAdminSchema,
  estadoPublicacionSchema,
  estadoUsuarioSchema,
} from "../schemas/admin.schema.js";
import {
  actualizarEstadoPublicacion,
  actualizarEstadoUsuario,
  eliminarPublicacionAdmin,
  listarPublicacionesPendientes,
  listarUsuarios,
} from "../services/admin.service.js";
import { eliminarComentarioAdmin } from "../services/comentario.service.js";
import { parseIdParam } from "../utils/parseId.js";

export async function getUsuarios(req: Request, res: Response): Promise<void> {
  const usuarios = await listarUsuarios();
  res.json(usuarios);
}

export async function patchEstadoUsuario(req: Request, res: Response): Promise<void> {
  const input = estadoUsuarioSchema.parse(req.body);
  await actualizarEstadoUsuario(parseIdParam(req.params.id), input);
  res.json({ ok: true });
}

export async function getPublicacionesPendientes(req: Request, res: Response): Promise<void> {
  const publicaciones = await listarPublicacionesPendientes();
  res.json(publicaciones);
}

export async function patchEstadoPublicacion(req: Request, res: Response): Promise<void> {
  const input = estadoPublicacionSchema.parse(req.body);
  await actualizarEstadoPublicacion(parseIdParam(req.params.id), input);
  res.json({ ok: true });
}

export async function deletePublicacionAdmin(req: Request, res: Response): Promise<void> {
  const { motivo } = eliminarPublicacionAdminSchema.parse(req.body ?? {});
  await eliminarPublicacionAdmin(parseIdParam(req.params.id), motivo);
  res.status(204).send();
}

export async function deleteComentarioAdmin(req: Request, res: Response): Promise<void> {
  const { motivo } = eliminarComentarioAdminSchema.parse(req.body ?? {});
  await eliminarComentarioAdmin(parseIdParam(req.params.id), motivo);
  res.status(204).send();
}
