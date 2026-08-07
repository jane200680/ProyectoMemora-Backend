import { z } from "zod";

const SOLO_LETRAS = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ\s]+$/;
const soloLetrasSchema = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .regex(SOLO_LETRAS, "Solo se permiten letras y espacios");

const contrasenaSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "La contraseña debe incluir al menos una letra mayúscula")
  .regex(/[a-z]/, "La contraseña debe incluir al menos una letra minúscula")
  .regex(/[0-9]/, "La contraseña debe incluir al menos un número")
  .regex(/[^A-Za-z0-9]/, "La contraseña debe incluir al menos un carácter especial");

export const registerSchema = z.object({
  nombre: soloLetrasSchema(1, 100),
  apellido: soloLetrasSchema(1, 150),
  correo: z.string().trim().email().max(255),
  contrasena: contrasenaSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  correo: z.string().trim().email(),
  contrasena: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const googleLoginSchema = z.object({
  id_token: z.string().min(1),
});

export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

export const actualizarPerfilSchema = z.object({
  nombre_usuario: z.string().trim().min(3).max(100),
  nombre: soloLetrasSchema(1, 100),
  apellido: soloLetrasSchema(1, 150),
});

export type ActualizarPerfilInput = z.infer<typeof actualizarPerfilSchema>;

export const forgotPasswordSchema = z.object({
  correo: z.string().trim().email(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  contrasena: contrasenaSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
