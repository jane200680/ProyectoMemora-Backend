import {
  crearComentario as crearComentarioRepo,
  listarComentarios,
} from "../repositories/comentario.repository.js";
import type { CrearComentarioInput } from "../schemas/interaccion.schema.js";
import type { ComentarioRow } from "../types/interaccion.js";

export interface ComentarioDTO {
  id: number;
  autor: string;
  fotoPerfil: string | null;
  fecha: string;
  contenido: string;
  respuestas: ComentarioDTO[];
}

function construirArbol(filas: ComentarioRow[]): ComentarioDTO[] {
  const nodos = new Map<number, ComentarioDTO>();

  for (const fila of filas) {
    nodos.set(fila.id_comentario, {
      id: fila.id_comentario,
      autor: `${fila.nombre} ${fila.apellido}`,
      fotoPerfil: fila.foto_perfil,
      fecha: fila.fecha_comentario.toISOString(),
      contenido: fila.contenido,
      respuestas: [],
    });
  }

  const raiz: ComentarioDTO[] = [];

  for (const fila of filas) {
    const nodo = nodos.get(fila.id_comentario)!;
    if (fila.comentario_id_comentario && nodos.has(fila.comentario_id_comentario)) {
      nodos.get(fila.comentario_id_comentario)!.respuestas.push(nodo);
    } else {
      raiz.push(nodo);
    }
  }

  return raiz;
}

export async function obtenerComentarios(idPublicacion: number): Promise<ComentarioDTO[]> {
  const filas = await listarComentarios(idPublicacion);
  return construirArbol(filas);
}

export async function crearComentario(
  idUsuario: number,
  idPublicacion: number,
  input: CrearComentarioInput
) {
  const id = await crearComentarioRepo(idUsuario, idPublicacion, input);
  return { id_comentario: id };
}
