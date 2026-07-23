import { Router } from "express";
import { adminRouter } from "./admin.routes.js";
import { authRouter } from "./auth.routes.js";
import { publicacionRouter } from "./publicacion.routes.js";

export const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRouter);
router.use("/publicaciones", publicacionRouter);
router.use("/admin", adminRouter);
