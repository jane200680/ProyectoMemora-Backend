import { z } from "zod";

export const registerSchema = z.object({
  nombre_usuario: z.string().trim().min(3).max(100),
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(150),
  correo: z.string().trim().email().max(255),
  contrasena: z.string().min(8).max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  correo: z.string().trim().email(),
  contrasena: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
