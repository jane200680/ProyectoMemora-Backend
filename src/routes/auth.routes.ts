import { Router } from "express";
import { login, patchPerfil, register } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

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
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre_usuario, nombre, apellido]
 *             properties:
 *               nombre_usuario: { type: string }
 *               nombre: { type: string }
 *               apellido: { type: string }
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *       401:
 *         description: No autenticado
 *       409:
 *         description: Nombre de usuario ya en uso
 */
authRouter.patch("/perfil", authenticate, patchPerfil);
