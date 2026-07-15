import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { publicacionRouter } from './publicacion.routes.js';

const router = Router();

router.use('/', authRouter);
router.use('/publicaciones', publicacionRouter);

export { router as apiRouter };