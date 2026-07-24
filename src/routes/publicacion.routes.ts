import { Router } from "express";
import { getComentarios, postComentario } from "../controllers/comentario.controller.js";
import { getFeed, postPublicacion } from "../controllers/publicacion.controller.js";
import { postReaccion } from "../controllers/reaccion.controller.js";
import { authenticate, authenticateOpcional } from "../middleware/auth.js";
import { uploadArchivosMultimedia } from "../middleware/upload.js";

export const publicacionRouter = Router();

publicacionRouter.get("/", authenticateOpcional, getFeed);
publicacionRouter.post("/", authenticate, uploadArchivosMultimedia, postPublicacion);

publicacionRouter.post("/:id/reacciones", authenticate, postReaccion);

publicacionRouter.get("/:id/comentarios", getComentarios);
publicacionRouter.post("/:id/comentarios", authenticate, postComentario);
