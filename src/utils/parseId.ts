import { HttpError } from "../middleware/errorHandler.js";

/**
 * Convierte un parámetro de ruta a un entero positivo o lanza un 400.
 * Evita que un id inválido (ej. "abc", vacío) llegue como NaN a una consulta SQL.
 */
export function parseIdParam(valor: string | string[] | undefined): number {
  const id = Number(typeof valor === "string" ? valor : NaN);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "El identificador debe ser un número entero positivo");
  }
  return id;
}
