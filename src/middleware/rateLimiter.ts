import type { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";


function resolverIpCliente(req: Request): string {
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  const ip = (typeof cfConnectingIp === "string" && cfConnectingIp) || req.ip || "sin-ip";
  return ipKeyGenerator(ip);
}


export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolverIpCliente,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolverIpCliente,
  message: { message: "Demasiados intentos, intenta de nuevo más tarde." },
});
