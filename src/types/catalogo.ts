export interface CategoriaCultural {
  id_categoria: number;
  nombre_categoria: string;
  descripcion: string | null;
  icono: string | null;
}

export interface LugarCultural {
  id_lugar: number;
  nombre_lugar: string;
  descripcion: string | null;
  direccion_referencial: string | null;
  latitud: number | null;
  longitud: number | null;
}
