import { Router } from "express";
import {
  forgotPassword,
  login,
  patchPerfil,
  register,
  resetPassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { uploadFotoPerfil } from "../middleware/upload.js";

export const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar un nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Usuario registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Correo o nombre de usuario ya registrado
 */
authRouter.post("/register", register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Sesión iniciada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.post("/login", login);

/**
 * @openapi
 * /auth/perfil:
 *   patch:
 *     tags: [Auth]
 *     summary: Actualizar el perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [nombre_usuario, nombre, apellido]
 *             properties:
 *               nombre_usuario: { type: string }
 *               nombre: { type: string }
 *               apellido: { type: string }
 *               foto_perfil: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *       401:
 *         description: No autenticado
 *       409:
 *         description: Nombre de usuario ya en uso
 */
authRouter.patch("/perfil", authenticate, uploadFotoPerfil, patchPerfil);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Solicitar restablecimiento de contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo]
 *             properties:
 *               correo: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Instrucciones enviadas (si el correo existe)
 */
authRouter.post("/forgot-password", forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Restablecer contraseña con un token válido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, contrasena]
 *             properties:
 *               token: { type: string }
 *               contrasena: { type: string, minLength: 8, maxLength: 100 }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         description: Token inválido o expirado
 */
authRouter.post("/reset-password", resetPassword);
