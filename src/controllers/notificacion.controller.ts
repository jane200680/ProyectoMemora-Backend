import type { Request, Response } from "express";
import {
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLasNotificacionesLeidas,
} from "../services/notificacion.service.js";

export async function getNotificaciones(req: Request, res: Response): Promise<void> {
  const resultado = await listarNotificaciones(req.user!.id_usuario);
  res.json(resultado);
}

export async function patchNotificacionLeida(req: Request, res: Response): Promise<void> {
  await marcarNotificacionLeida(req.user!.id_usuario, Number(req.params.id));
  res.json({ ok: true });
}

export async function patchTodasLeidas(req: Request, res: Response): Promise<void> {
  await marcarTodasLasNotificacionesLeidas(req.user!.id_usuario);
  res.json({ ok: true });
}
