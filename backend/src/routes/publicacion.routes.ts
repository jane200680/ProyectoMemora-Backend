import { Router } from 'express';
import {
  createPublicacion,
  deletePublicacion,
  getPublicacion,
  listPublicaciones,
  updatePublicacion,
} from '../controllers/publicacion.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', listPublicaciones);
router.get('/:id', getPublicacion);
router.post('/', requireAuth, createPublicacion);
router.put('/:id', requireAuth, requireAdmin, updatePublicacion);
router.delete('/:id', requireAuth, requireAdmin, deletePublicacion);

export { router as publicacionRouter };