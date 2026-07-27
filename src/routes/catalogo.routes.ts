import { Router } from "express";
import { getCategorias } from "../controllers/categoria.controller.js";
import { getLugares } from "../controllers/lugar.controller.js";

export const catalogoRouter = Router();

/**
 * @openapi
 * /catalogos/categorias:
 *   get:
 *     tags: [Catálogos]
 *     summary: Listar categorías culturales (público)
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
catalogoRouter.get("/categorias", getCategorias);

/**
 * @openapi
 * /catalogos/lugares:
 *   get:
 *     tags: [Catálogos]
 *     summary: Listar lugares culturales (público)
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
catalogoRouter.get("/lugares", getLugares);
