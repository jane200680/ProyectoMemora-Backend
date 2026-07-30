import type { Request, Response } from "express";
import { lugarSchema } from "../schemas/admin.schema.js";
import { actualizarLugar, crearLugar, eliminarLugar, listarLugares } from "../services/lugar.service.js";
import { parseIdParam } from "../utils/parseId.js";

export async function getLugares(req: Request, res: Response): Promise<void> {
  const lugares = await listarLugares();
  res.json(lugares);
}

export async function postLugar(req: Request, res: Response): Promise<void> {
  const input = lugarSchema.parse(req.body);
  const resultado = await crearLugar(input);
  res.status(201).json(resultado);
}

export async function putLugar(req: Request, res: Response): Promise<void> {
  const input = lugarSchema.parse(req.body);
  await actualizarLugar(parseIdParam(req.params.id), input);
  res.json({ ok: true });
}

export async function deleteLugar(req: Request, res: Response): Promise<void> {
  await eliminarLugar(parseIdParam(req.params.id));
  res.json({ ok: true });
}
