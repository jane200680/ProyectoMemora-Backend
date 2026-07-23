import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { publicacionRouter } from "./publicacion.routes.js";

export const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRouter);
router.use("/publicaciones", publicacionRouter);
