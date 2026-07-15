import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

export async function register(req: Request, res: Response, next: NextFunction) {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors.map((err) => err.message).join(', ') });
  }

  try {
    const result = await AuthService.register(parseResult.data);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      const statusCode = (error as any).statusCode as number;
      return res.status(statusCode).json({ error: error.message });
    }
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors.map((err) => err.message).join(', ') });
  }

  try {
    const result = await AuthService.login(parseResult.data);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      const statusCode = (error as any).statusCode as number;
      return res.status(statusCode).json({ error: error.message });
    }
    next(error);
  }
}
