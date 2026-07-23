import { Router } from "express";
import { getFeed } from "../controllers/publicacion.controller.js";

export const publicacionRouter = Router();

publicacionRouter.get("/", getFeed);
