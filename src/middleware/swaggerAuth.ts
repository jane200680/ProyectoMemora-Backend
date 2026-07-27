import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

const COOKIE_NAME = "memora_docs_session";
const SESION_MS = 12 * 60 * 60 * 1000;

function firmar(valor: string): string {
  return createHmac("sha256", env.jwt.secret).update(valor).digest("hex");
}

function compararSeguro(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function crearToken(usuario: string): string {
  const expira = Date.now() + SESION_MS;
  const payload = `${usuario}.${expira}`;
  return `${payload}.${firmar(payload)}`;
}

function tokenValido(token: string | undefined): boolean {
  if (!token) return false;
  const partes = token.split(".");
  if (partes.length !== 3) return false;
  const [usuario, expiraStr, firma] = partes;
  const payload = `${usuario}.${expiraStr}`;
  if (!compararSeguro(firma, firmar(payload))) return false;
  const expira = Number(expiraStr);
  return Number.isFinite(expira) && Date.now() < expira;
}

function leerCookie(req: Request): string | undefined {
  const cookies = req.headers.cookie;
  if (!cookies) return undefined;
  for (const parte of cookies.split(";")) {
    const [nombre, ...resto] = parte.trim().split("=");
    if (nombre === COOKIE_NAME) return decodeURIComponent(resto.join("="));
  }
  return undefined;
}

export function swaggerGuard(req: Request, res: Response, next: NextFunction): void {
  if (tokenValido(leerCookie(req))) {
    next();
    return;
  }
  res.redirect("/api/docs/login");
}

function paginaLogin(error?: string): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Memora API Docs - Login</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0;
    display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  form { background: #1e293b; padding: 2rem 2.5rem; border-radius: 12px; width: 320px;
    box-shadow: 0 10px 30px rgba(0,0,0,.3); }
  h1 { font-size: 1.1rem; margin: 0 0 1.25rem; }
  label { display: block; font-size: .85rem; margin-bottom: .3rem; color: #94a3b8; }
  input { width: 100%; padding: .55rem .7rem; margin-bottom: 1rem; border-radius: 6px;
    border: 1px solid #334155; background: #0f172a; color: #e2e8f0; box-sizing: border-box; }
  button { width: 100%; padding: .6rem; border: none; border-radius: 6px; background: #6366f1;
    color: white; font-weight: 600; cursor: pointer; }
  button:hover { background: #4f46e5; }
  .error { color: #f87171; font-size: .85rem; margin-bottom: 1rem; }
</style>
</head>
<body>
  <form method="POST" action="/api/docs/login">
    <h1>Memora API Docs</h1>
    ${error ? `<div class="error">${error}</div>` : ""}
    <label for="usuario">Usuario</label>
    <input id="usuario" name="usuario" autocomplete="username" autofocus />
    <label for="password">Contraseña</label>
    <input id="password" name="password" type="password" autocomplete="current-password" />
    <button type="submit">Entrar</button>
  </form>
</body>
</html>`;
}

export function swaggerLoginPage(req: Request, res: Response): void {
  if (tokenValido(leerCookie(req))) {
    res.redirect("/api/docs");
    return;
  }
  res.type("html").send(paginaLogin());
}

export function swaggerLoginSubmit(req: Request, res: Response): void {
  const usuario = typeof req.body?.usuario === "string" ? req.body.usuario : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const credencialesValidas =
    usuario.length > 0 &&
    password.length > 0 &&
    compararSeguro(usuario, env.swagger.usuario) &&
    compararSeguro(password, env.swagger.password);

  if (!credencialesValidas) {
    res.status(401).type("html").send(paginaLogin("Usuario o contraseña incorrectos"));
    return;
  }

  res.cookie(COOKIE_NAME, crearToken(usuario), {
    httpOnly: true,
    secure: env.nodeEnv !== "development",
    sameSite: "lax",
    maxAge: SESION_MS,
  });
  res.redirect("/api/docs");
}

export function swaggerLogout(_req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME);
  res.redirect("/api/docs/login");
}
