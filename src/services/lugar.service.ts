import { HttpError } from "../middleware/errorHandler.js";
import {
  actualizarLugar as actualizarLugarRepo,
  crearLugar as crearLugarRepo,
  eliminarLugar as eliminarLugarRepo,
  listarLugares as listarLugaresRepo,
} from "../repositories/lugar.repository.js";
import type { LugarInput } from "../schemas/admin.schema.js";

export async function listarLugares() {
  return listarLugaresRepo();
}

export async function crearLugar(input: LugarInput) {
  const id = await crearLugarRepo(input);
  return { id_lugar: id };
}

export async function actualizarLugar(id: number, input: LugarInput) {
  const actualizado = await actualizarLugarRepo(id, input);
  if (!actualizado) {
    throw new HttpError(404, "Lugar no encontrado");
  }
}

export async function eliminarLugar(id: number) {
  const eliminado = await eliminarLugarRepo(id);
  if (!eliminado) {
    throw new HttpError(404, "Lugar no encontrado");
  }
}
