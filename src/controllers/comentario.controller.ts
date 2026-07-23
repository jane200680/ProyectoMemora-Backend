import type { Request, Response } from "express";
import { crearComentarioSchema } from "../schemas/interaccion.schema.js";
import { crearComentario, obtenerComentarios } from "../services/comentario.service.js";

export async function getComentarios(req: Request, res: Response): Promise<void> {
  const idPublicacion = Number(req.params.id);
  const comentarios = await obtenerComentarios(idPublicacion);
  res.json(comentarios);
}

export async function postComentario(req: Request, res: Response): Promise<void> {
  const idPublicacion = Number(req.params.id);
  const input = crearComentarioSchema.parse(req.body);
  const resultado = await crearComentario(req.user!.id_usuario, idPublicacion, input);
  res.status(201).json(resultado);
}
