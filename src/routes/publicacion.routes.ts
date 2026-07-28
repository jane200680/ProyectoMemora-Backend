import { Router } from "express";
import { getComentarios, postComentario } from "../controllers/comentario.controller.js";
import {
  deletePublicacion,
  getFeed,
  getPublicacionPropia,
  patchPublicacion,
  postPublicacion,
} from "../controllers/publicacion.controller.js";
import { postReaccion } from "../controllers/reaccion.controller.js";
import { authenticate, authenticateOpcional } from "../middleware/auth.js";
import { uploadArchivosMultimedia } from "../middleware/upload.js";

export const publicacionRouter = Router();

/**
 * @openapi
 * /publicaciones:
 *   get:
 *     tags: [Publicaciones]
 *     summary: Obtener el feed de publicaciones aprobadas (con paginación y filtros)
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limite
 *         schema: { type: integer, default: 10, maximum: 50 }
 *       - in: query
 *         name: tipo_contenido
 *         schema: { type: string }
 *       - in: query
 *         name: categoria
 *         schema: { type: integer }
 *       - in: query
 *         name: lugar
 *         schema: { type: integer }
 *       - in: query
 *         name: anio
 *         schema: { type: integer }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Feed de publicaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 datos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Publicacion'
 *                 total: { type: integer }
 *                 pagina: { type: integer }
 *                 limite: { type: integer }
 */
publicacionRouter.get("/", authenticateOpcional, getFeed);

/**
 * @openapi
 * /publicaciones:
 *   post:
 *     tags: [Publicaciones]
 *     summary: Crear una publicación (queda en estado Pendiente)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CrearPublicacionInput'
 *     responses:
 *       201:
 *         description: Publicación creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Publicacion'
 *       401:
 *         description: No autenticado
 */
publicacionRouter.post("/", authenticate, uploadArchivosMultimedia, postPublicacion);

/**
 * @openapi
 * /publicaciones/{id}:
 *   delete:
 *     tags: [Publicaciones]
 *     summary: Eliminar una publicación propia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Publicación eliminada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: La publicación no pertenece al usuario
 *       404:
 *         description: Publicación no encontrada
 */
publicacionRouter.delete("/:id", authenticate, deletePublicacion);

/**
 * @openapi
 * /publicaciones/{id}/editar:
 *   get:
 *     tags: [Publicaciones]
 *     summary: Obtener los datos propios de una publicación para editarla
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos de la publicación
 *       401:
 *         description: No autenticado
 *       403:
 *         description: La publicación no pertenece al usuario
 *       404:
 *         description: Publicación no encontrada
 */
publicacionRouter.get("/:id/editar", authenticate, getPublicacionPropia);

/**
 * @openapi
 * /publicaciones/{id}:
 *   patch:
 *     tags: [Publicaciones]
 *     summary: Editar una publicación propia (vuelve a quedar Pendiente)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CrearPublicacionInput'
 *     responses:
 *       200:
 *         description: Publicación actualizada, vuelve a estado Pendiente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: La publicación no pertenece al usuario
 *       404:
 *         description: Publicación no encontrada
 */
publicacionRouter.patch("/:id", authenticate, uploadArchivosMultimedia, patchPublicacion);

/**
 * @openapi
 * /publicaciones/{id}/reacciones:
 *   post:
 *     tags: [Publicaciones]
 *     summary: Alternar (like/unlike) una reacción sobre una publicación
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Reacción actualizada
 *       401:
 *         description: No autenticado
 */
publicacionRouter.post("/:id/reacciones", authenticate, postReaccion);

/**
 * @openapi
 * /publicaciones/{id}/comentarios:
 *   get:
 *     tags: [Publicaciones]
 *     summary: Listar comentarios de una publicación (incluye respuestas anidadas)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de comentarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comentario'
 */
publicacionRouter.get("/:id/comentarios", getComentarios);

/**
 * @openapi
 * /publicaciones/{id}/comentarios:
 *   post:
 *     tags: [Publicaciones]
 *     summary: Crear un comentario o respuesta en una publicación
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenido]
 *             properties:
 *               contenido: { type: string }
 *               id_comentario_padre: { type: integer, nullable: true }
 *     responses:
 *       201:
 *         description: Comentario creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comentario'
 *       401:
 *         description: No autenticado
 */
publicacionRouter.post("/:id/comentarios", authenticate, postComentario);
