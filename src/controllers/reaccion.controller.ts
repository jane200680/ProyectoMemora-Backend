import type { Request, Response } from "express";
import { alternarReaccion } from "../services/reaccion.service.js";
import { parseIdParam } from "../utils/parseId.js";

export async function postReaccion(req: Request, res: Response): Promise<void> {
  const idPublicacion = parseIdParam(req.params.id);
  const resultado = await alternarReaccion(req.user!.id_usuario, idPublicacion);
  res.json(resultado);
}
