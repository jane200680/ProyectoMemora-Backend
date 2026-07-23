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

adminRouter.get("/usuarios", getUsuarios);
adminRouter.patch("/usuarios/:id/estado", patchEstadoUsuario);

adminRouter.get("/publicaciones/pendientes", getPublicacionesPendientes);
adminRouter.patch("/publicaciones/:id/estado", patchEstadoPublicacion);

adminRouter.get("/categorias", getCategorias);
adminRouter.post("/categorias", postCategoria);
adminRouter.put("/categorias/:id", putCategoria);
adminRouter.delete("/categorias/:id", deleteCategoria);

adminRouter.get("/lugares", getLugares);
adminRouter.post("/lugares", postLugar);
adminRouter.put("/lugares/:id", putLugar);
adminRouter.delete("/lugares/:id", deleteLugar);
