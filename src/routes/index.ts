import { Router } from "express";
import { publicacionRouter } from "./publicacion.routes.js";

export const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/publicaciones", publicacionRouter);
