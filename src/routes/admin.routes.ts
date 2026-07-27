import { Router } from "express";
import {
  getPublicacionesPendientes,
  getUsuarios,
  patchEstadoPublicacion,
  patchEstadoUsuario,
} from "../controllers/admin.controller.js";
import {
  deleteCategoria,
  getCategorias,
  postCategoria,
  putCategoria,
} from "../controllers/categoria.controller.js";
import { deleteLugar, getLugares, postLugar, putLugar } from "../controllers/lugar.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(authenticate, authorize("Administrador"));

/**
 * @openapi
 * /admin/usuarios:
 *   get:
 *     tags: [Admin]
 *     summary: Listar usuarios (solo Administrador)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: No autorizado
 */
adminRouter.get("/usuarios", getUsuarios);

/**
 * @openapi
 * /admin/usuarios/{id}/estado:
 *   patch:
 *     tags: [Admin]
 *     summary: Cambiar el estado (activo/inactivo) de un usuario
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
 *             properties:
 *               estado: { type: string }
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       403:
 *         description: No autorizado
 */
adminRouter.patch("/usuarios/:id/estado", patchEstadoUsuario);

/**
 * @openapi
 * /admin/publicaciones/pendientes:
 *   get:
 *     tags: [Admin]
 *     summary: Listar publicaciones pendientes de revisión
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de publicaciones pendientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Publicacion'
 *       403:
 *         description: No autorizado
 */
adminRouter.get("/publicaciones/pendientes", getPublicacionesPendientes);

/**
 * @openapi
 * /admin/publicaciones/{id}/estado:
 *   patch:
 *     tags: [Admin]
 *     summary: Aprobar o rechazar una publicación
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
 *             required: [estado]
 *             properties:
 *               estado: { type: string, enum: [Aprobada, Rechazada] }
 *     responses:
 *       200:
 *         description: Publicación actualizada
 *       403:
 *         description: No autorizado
 */
adminRouter.patch("/publicaciones/:id/estado", patchEstadoPublicacion);

/**
 * @openapi
 * /admin/categorias:
 *   get:
 *     tags: [Admin]
 *     summary: Listar categorías culturales (Administrador)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Categoria'
 */
adminRouter.get("/categorias", getCategorias);

/**
 * @openapi
 * /admin/categorias:
 *   post:
 *     tags: [Admin]
 *     summary: Crear una categoría cultural
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre: { type: string }
 *     responses:
 *       201:
 *         description: Categoría creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 */
adminRouter.post("/categorias", postCategoria);

/**
 * @openapi
 * /admin/categorias/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Actualizar una categoría cultural
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
 *             properties:
 *               nombre: { type: string }
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *       404:
 *         description: Categoría no encontrada
 */
adminRouter.put("/categorias/:id", putCategoria);

/**
 * @openapi
 * /admin/categorias/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Eliminar una categoría cultural
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Categoría eliminada
 *       404:
 *         description: Categoría no encontrada
 */
adminRouter.delete("/categorias/:id", deleteCategoria);

/**
 * @openapi
 * /admin/lugares:
 *   get:
 *     tags: [Admin]
 *     summary: Listar lugares culturales (Administrador)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de lugares
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lugar'
 */
adminRouter.get("/lugares", getLugares);

/**
 * @openapi
 * /admin/lugares:
 *   post:
 *     tags: [Admin]
 *     summary: Crear un lugar cultural
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre: { type: string }
 *     responses:
 *       201:
 *         description: Lugar creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lugar'
 */
adminRouter.post("/lugares", postLugar);

/**
 * @openapi
 * /admin/lugares/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Actualizar un lugar cultural
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
 *             properties:
 *               nombre: { type: string }
 *     responses:
 *       200:
 *         description: Lugar actualizado
 *       404:
 *         description: Lugar no encontrado
 */
adminRouter.put("/lugares/:id", putLugar);

/**
 * @openapi
 * /admin/lugares/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Eliminar un lugar cultural
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lugar eliminado
 *       404:
 *         description: Lugar no encontrado
 */
adminRouter.delete("/lugares/:id", deleteLugar);
