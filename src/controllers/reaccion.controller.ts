import type { Request, Response } from "express";
import { alternarReaccion } from "../services/reaccion.service.js";

export async function postReaccion(req: Request, res: Response): Promise<void> {
  const idPublicacion = Number(req.params.id);
  const resultado = await alternarReaccion(req.user!.id_usuario, idPublicacion);
  res.json(resultado);
}
