import type { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Identifica al cliente real detrás de Cloudflare + Nginx (ver 10GuiaSSL.md).
 *
 * NO usamos `req.ip`/`X-Forwarded-For` con `trust proxy` numérico: un cliente
 * puede añadir sus propias entradas a `X-Forwarded-For` y, al alargar la
 * cadena, desplazar qué posición se toma como "cliente", consiguiendo un
 * cupo de rate limit nuevo en cada petición (verificado en producción).
 *
 * `CF-Connecting-IP` en cambio lo fija Cloudflare en su borde y no puede ser
 * falsificado por el cliente (Cloudflare lo sobrescribe/filtra), así que es
 * la fuente confiable para identificar usuarios reales.
 */
function resolverIpCliente(req: Request): string {
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  const ip = (typeof cfConnectingIp === "string" && cfConnectingIp) || req.ip || "sin-ip";
  return ipKeyGenerator(ip);
}

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolverIpCliente,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolverIpCliente,
  message: { message: "Demasiados intentos, intenta de nuevo más tarde." },
});
