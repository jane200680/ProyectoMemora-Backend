import { Request, Response, NextFunction } from 'express';
import { PublicacionService } from '../services/publicacion.service.js';
import { createPublicacionSchema, updatePublicacionSchema } from '../schemas/publicacion.schema.js';

export async function listPublicaciones(_req: Request, res: Response, next: NextFunction) {
  try {
    const publicaciones = await PublicacionService.listAll();
    res.json(publicaciones);
  } catch (error) {
    next(error);
  }
}

export async function getPublicacion(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const publicacion = await PublicacionService.findById(id);

    if (!publicacion) {
      return res.status(404).json({ error: 'Publicación no encontrada.' });
    }

    res.json(publicacion);
  } catch (error) {
    next(error);
  }
}

export async function createPublicacion(req: Request, res: Response, next: NextFunction) {
  const parseResult = createPublicacionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(422).json({ error: parseResult.error.errors.map((err) => err.message).join(', ') });
  }

  try {
    const userId = req.user?.sub;
    const created = await PublicacionService.create(parseResult.data, userId!);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function updatePublicacion(req: Request, res: Response, next: NextFunction) {
  const parseResult = updatePublicacionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors.map((err) => err.message).join(', ') });
  }

  try {
    const id = Number(req.params.id);
    const updated = await PublicacionService.update(id, parseResult.data);

    if (!updated) {
      return res.status(404).json({ error: 'Publicación no encontrada.' });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deletePublicacion(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const deleted = await PublicacionService.remove(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Publicación no encontrada.' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
