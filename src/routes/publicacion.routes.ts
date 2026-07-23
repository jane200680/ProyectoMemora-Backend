import { Router } from "express";
import { getFeed, postPublicacion } from "../controllers/publicacion.controller.js";
import { authenticate } from "../middleware/auth.js";

export const publicacionRouter = Router();

publicacionRouter.get("/", getFeed);
publicacionRouter.post("/", authenticate, postPublicacion);
