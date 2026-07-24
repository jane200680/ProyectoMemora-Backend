import type { Request, Response } from "express";
import { crearPublicacionSchema, feedQuerySchema } from "../schemas/publicacion.schema.js";
import { crearPublicacion, obtenerFeed } from "../services/publicacion.service.js";

export async function getFeed(req: Request, res: Response): Promise<void> {
  const { pagina, limite, tipo_contenido, categoria, lugar, anio, q } = feedQuerySchema.parse(
    req.query
  );

  const feed = await obtenerFeed(pagina, limite, req.user?.id_usuario ?? null, {
    tipo_contenido,
    categoria,
    lugar,
    anio,
    q,
  });
  res.json(feed);
}

export async function postPublicacion(req: Request, res: Response): Promise<void> {
  const input = crearPublicacionSchema.parse(req.body);
  const archivos = (req.files as Express.Multer.File[] | undefined) ?? [];
  const resultado = await crearPublicacion(req.user!.id_usuario, input, archivos);
  res.status(201).json(resultado);
}
