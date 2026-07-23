export type TipoContenido =
  | "Relato escrito"
  | "Fotografía"
  | "Video"
  | "Audio"
  | "Documento histórico"
  | "Receta"
  | "Testimonio comunitario"
  | "Evento cultural"
  | "Lugar recomendado";

export interface PublicacionFeedRow {
  id_publicacion: number;
  titulo: string;
  descripcion: string;
  tipo_contenido: TipoContenido;
  fecha_publicacion: Date;
  id_usuario: number;
  nombre: string;
  apellido: string;
  foto_perfil: string | null;
  imagen: string | null;
  total_comentarios: number;
  total_reacciones: number;
  reacciono: number;
}

export interface FeedQuery {
  pagina: number;
  limite: number;
}
