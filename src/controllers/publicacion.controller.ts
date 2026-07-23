import type { Request, Response } from "express";
import { crearPublicacionSchema } from "../schemas/publicacion.schema.js";
import { crearPublicacion, obtenerFeed } from "../services/publicacion.service.js";

export async function getFeed(req: Request, res: Response): Promise<void> {
  const pagina = Math.max(1, Number(req.query.pagina) || 1);
  const limite = Math.min(50, Math.max(1, Number(req.query.limite) || 10));

  const feed = await obtenerFeed(pagina, limite, req.user?.id_usuario ?? null);
  res.json(feed);
}

export async function postPublicacion(req: Request, res: Response): Promise<void> {
  const input = crearPublicacionSchema.parse(req.body);
  const resultado = await crearPublicacion(req.user!.id_usuario, input);
  res.status(201).json(resultado);
}
