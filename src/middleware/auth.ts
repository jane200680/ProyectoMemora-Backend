import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "./errorHandler.js";

export interface AuthPayload {
  id_usuario: number;
  rol: "Administrador" | "Usuario";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    next(new HttpError(401, "No se proporcionó un token de autenticación"));
    return;
  }

  try {
    req.user = jwt.verify(token, env.jwt.secret) as AuthPayload;
    next();
  } catch {
    next(new HttpError(401, "Token inválido o expirado"));
  }
}

export function authenticateOpcional(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    next();
    return;
  }

  try {
    req.user = jwt.verify(token, env.jwt.secret) as AuthPayload;
  } catch {
    // Token invalido o expirado: se continua como usuario anonimo.
  }

  next();
}

export function authorize(...rolesPermitidos: AuthPayload["rol"][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      next(new HttpError(403, "No tienes permisos para acceder a este recurso"));
      return;
    }
    next();
  };
}
