export type Rol = "Administrador" | "Usuario";
export type EstadoUsuario = "Activo" | "Inactivo" | "Suspendido";

export interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: Rol;
  estado: EstadoUsuario;
  foto_perfil: string | null;
}

export interface UsuarioConHash extends Usuario {
  contrasena_hash: string;
}
