import type { Request, Response } from "express";
import {
  crearPublicacionSchema,
  editarPublicacionSchema,
  feedQuerySchema,
} from "../schemas/publicacion.schema.js";
import {
  crearPublicacion,
  editarPublicacion,
  eliminarPublicacion,
  obtenerFeed,
  obtenerPublicacionPorId,
  obtenerPublicacionPropia,
} from "../services/publicacion.service.js";
import { parseIdParam } from "../utils/parseId.js";

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

export async function getPublicacionPorId(req: Request, res: Response): Promise<void> {
  const idPublicacion = parseIdParam(req.params.id);
  const publicacion = await obtenerPublicacionPorId(idPublicacion, req.user?.id_usuario ?? null);
  res.json(publicacion);
}

export async function postPublicacion(req: Request, res: Response): Promise<void> {
  const input = crearPublicacionSchema.parse(req.body);
  const archivos = (req.files as Express.Multer.File[] | undefined) ?? [];
  const resultado = await crearPublicacion(req.user!.id_usuario, input, archivos);
  res.status(201).json(resultado);
}

export async function deletePublicacion(req: Request, res: Response): Promise<void> {
  const idPublicacion = parseIdParam(req.params.id);
  await eliminarPublicacion(req.user!.id_usuario, idPublicacion);
  res.status(204).send();
}

export async function getPublicacionPropia(req: Request, res: Response): Promise<void> {
  const idPublicacion = parseIdParam(req.params.id);
  const detalle = await obtenerPublicacionPropia(req.user!.id_usuario, idPublicacion);
  res.json(detalle);
}

export async function patchPublicacion(req: Request, res: Response): Promise<void> {
  const idPublicacion = parseIdParam(req.params.id);
  const input = editarPublicacionSchema.parse(req.body);
  const archivos = (req.files as Express.Multer.File[] | undefined) ?? [];
  await editarPublicacion(req.user!.id_usuario, idPublicacion, input, archivos);
  res.status(200).json({ estado: "Pendiente" as const });
}
