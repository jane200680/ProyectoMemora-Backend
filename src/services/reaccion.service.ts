import {
  contarReacciones,
  crearReaccion,
  eliminarReaccion,
  existeReaccion,
} from "../repositories/reaccion.repository.js";

export async function alternarReaccion(idUsuario: number, idPublicacion: number) {
  const yaReacciono = await existeReaccion(idUsuario, idPublicacion);

  if (yaReacciono) {
    await eliminarReaccion(idUsuario, idPublicacion);
  } else {
    await crearReaccion(idUsuario, idPublicacion);
  }

  const total = await contarReacciones(idPublicacion);
  return { reaccionado: !yaReacciono, total };
}
