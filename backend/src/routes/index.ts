import { Router, Request, Response } from 'express';
import { authRouter } from './auth.routes.js';
import { publicacionRouter } from './publicacion.routes.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "API está online" });
});

router.use('/', authRouter);
router.use('/publicaciones', publicacionRouter);

export { router as apiRouter };