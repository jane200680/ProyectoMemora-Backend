export type TipoContenido =
  | "Relato escrito"
  | "Fotografía"
  | "Video"
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
  imagenes: string | null;
  archivos_raw: string | null;
  total_comentarios: number;
  total_reacciones: number;
  reacciono: number;
}

export interface FeedQuery {
  pagina: number;
  limite: number;
}

export type TipoArchivo = "Imagen" | "Video" | "Documento";

export interface ArchivoMultimediaInput {
  tipo_archivo: TipoArchivo;
  url_archivo: string;
}

export interface ArchivoMultimediaRow {
  id_archivo: number;
  tipo_archivo: TipoArchivo;
  url_archivo: string;
}
