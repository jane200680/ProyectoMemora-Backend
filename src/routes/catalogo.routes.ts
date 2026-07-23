import { Router } from "express";
import { getCategorias } from "../controllers/categoria.controller.js";
import { getLugares } from "../controllers/lugar.controller.js";

export const catalogoRouter = Router();

catalogoRouter.get("/categorias", getCategorias);
catalogoRouter.get("/lugares", getLugares);
