export interface ComentarioRow {
  id_comentario: number;
  contenido: string;
  fecha_comentario: Date;
  id_usuario: number;
  nombre: string;
  apellido: string;
  foto_perfil: string | null;
  comentario_id_comentario: number | null;
}
