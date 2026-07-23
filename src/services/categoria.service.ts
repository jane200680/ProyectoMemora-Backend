import { HttpError } from "../middleware/errorHandler.js";
import {
  actualizarCategoria as actualizarCategoriaRepo,
  crearCategoria as crearCategoriaRepo,
  eliminarCategoria as eliminarCategoriaRepo,
  listarCategorias as listarCategoriasRepo,
} from "../repositories/categoria.repository.js";
import type { CategoriaInput } from "../schemas/admin.schema.js";

export async function listarCategorias() {
  return listarCategoriasRepo();
}

export async function crearCategoria(input: CategoriaInput) {
  const id = await crearCategoriaRepo(input);
  return { id_categoria: id };
}

export async function actualizarCategoria(id: number, input: CategoriaInput) {
  const actualizado = await actualizarCategoriaRepo(id, input);
  if (!actualizado) {
    throw new HttpError(404, "Categoría no encontrada");
  }
}

export async function eliminarCategoria(id: number) {
  const eliminado = await eliminarCategoriaRepo(id);
  if (!eliminado) {
    throw new HttpError(404, "Categoría no encontrada");
  }
}
