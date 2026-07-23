import type { Request, Response } from "express";
import { categoriaSchema } from "../schemas/admin.schema.js";
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
} from "../services/categoria.service.js";

export async function getCategorias(req: Request, res: Response): Promise<void> {
  const categorias = await listarCategorias();
  res.json(categorias);
}

export async function postCategoria(req: Request, res: Response): Promise<void> {
  const input = categoriaSchema.parse(req.body);
  const resultado = await crearCategoria(input);
  res.status(201).json(resultado);
}

export async function putCategoria(req: Request, res: Response): Promise<void> {
  const input = categoriaSchema.parse(req.body);
  await actualizarCategoria(Number(req.params.id), input);
  res.json({ ok: true });
}

export async function deleteCategoria(req: Request, res: Response): Promise<void> {
  await eliminarCategoria(Number(req.params.id));
  res.json({ ok: true });
}
