import { z } from 'zod';

export const registerSchema = z.object({
  nombre_usuario: z.string().min(3),
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  correo: z.string().email(),
  contrasena: z.string().min(6),
});

export const loginSchema = z.object({
  correo: z.string().email(),
  contrasena: z.string().min(6),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
