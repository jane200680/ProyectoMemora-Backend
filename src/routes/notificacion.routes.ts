import { Router } from "express";
import {
  deleteNotificacion,
  deleteTodasNotificaciones,
  getNotificaciones,
  patchNotificacionLeida,
  patchTodasLeidas,
} from "../controllers/notificacion.controller.js";
import { authenticate } from "../middleware/auth.js";

export const notificacionRouter = Router();

notificacionRouter.use(authenticate);

/**
 * @openapi
 * /notificaciones:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Listar notificaciones del usuario autenticado (con conteo de no leídas)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notificaciones del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 datos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notificacion'
 *                 no_leidas: { type: integer }
 *       401:
 *         description: No autenticado
 */
notificacionRouter.get("/", getNotificaciones);

/**
 * @openapi
 * /notificaciones/leidas:
 *   patch:
 *     tags: [Notificaciones]
 *     summary: Marcar todas las notificaciones del usuario como leídas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notificaciones marcadas como leídas
 *       401:
 *         description: No autenticado
 */
notificacionRouter.patch("/leidas", patchTodasLeidas);

/**
 * @openapi
 * /notificaciones/{id}/leida:
 *   patch:
 *     tags: [Notificaciones]
 *     summary: Marcar una notificación específica como leída
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Notificación no encontrada
 */
notificacionRouter.patch("/:id/leida", patchNotificacionLeida);

/**
 * @openapi
 * /notificaciones/{id}:
 *   delete:
 *     tags: [Notificaciones]
 *     summary: Eliminar una notificación específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Notificación eliminada
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Notificación no encontrada
 */
notificacionRouter.delete("/:id", deleteNotificacion);

/**
 * @openapi
 * /notificaciones:
 *   delete:
 *     tags: [Notificaciones]
 *     summary: Eliminar todas las notificaciones del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Notificaciones eliminadas
 *       401:
 *         description: No autenticado
 */
notificacionRouter.delete("/", deleteTodasNotificaciones);
