import type { Request, Response } from "express";
import {
  eliminarNotificacion,
  eliminarTodasLasNotificaciones,
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLasNotificacionesLeidas,
} from "../services/notificacion.service.js";
import { parseIdParam } from "../utils/parseId.js";

export async function getNotificaciones(req: Request, res: Response): Promise<void> {
  const resultado = await listarNotificaciones(req.user!.id_usuario);
  res.json(resultado);
}

export async function patchNotificacionLeida(req: Request, res: Response): Promise<void> {
  await marcarNotificacionLeida(req.user!.id_usuario, parseIdParam(req.params.id));
  res.json({ ok: true });
}

export async function patchTodasLeidas(req: Request, res: Response): Promise<void> {
  await marcarTodasLasNotificacionesLeidas(req.user!.id_usuario);
  res.json({ ok: true });
}

export async function deleteNotificacion(req: Request, res: Response): Promise<void> {
  await eliminarNotificacion(req.user!.id_usuario, parseIdParam(req.params.id));
  res.status(204).send();
}

export async function deleteTodasNotificaciones(req: Request, res: Response): Promise<void> {
  await eliminarTodasLasNotificaciones(req.user!.id_usuario);
  res.status(204).send();
}
