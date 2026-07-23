import {
  countFeedAprobado,
  crearPublicacion as crearPublicacionRepo,
  findFeedAprobado,
} from "../repositories/publicacion.repository.js";
import type { CrearPublicacionInput } from "../schemas/publicacion.schema.js";

export interface FeedItemDTO {
  id: number;
  autor: string;
  fotoPerfil: string | null;
  fecha: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  imagen: string | null;
  comentarios: number;
}

export interface FeedDTO {
  data: FeedItemDTO[];
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export async function obtenerFeed(pagina: number, limite: number): Promise<FeedDTO> {
  const offset = (pagina - 1) * limite;

  const [filas, total] = await Promise.all([
    findFeedAprobado(limite, offset),
    countFeedAprobado(),
  ]);

  const data: FeedItemDTO[] = filas.map((fila) => ({
    id: fila.id_publicacion,
    autor: `${fila.nombre} ${fila.apellido}`,
    fotoPerfil: fila.foto_perfil,
    fecha: fila.fecha_publicacion.toISOString(),
    tipo: fila.tipo_contenido,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    imagen: fila.imagen,
    comentarios: fila.total_comentarios,
  }));

  return {
    data,
    pagina,
    limite,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / limite)),
  };
}

export async function crearPublicacion(idUsuario: number, input: CrearPublicacionInput) {
  const idPublicacion = await crearPublicacionRepo(idUsuario, input);
  return { id_publicacion: idPublicacion, estado: "Pendiente" as const };
}
