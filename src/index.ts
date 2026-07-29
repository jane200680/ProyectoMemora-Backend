import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import {
  swaggerGuard,
  swaggerLoginPage,
  swaggerLoginSubmit,
  swaggerLogout,
} from "./middleware/swaggerAuth.js";
import { router } from "./routes/index.js";

function construirOrigenesPermitidos(frontendUrl: string): string[] {
  try {
    const url = new URL(frontendUrl);
    const conWww = url.hostname.startsWith("www.") ? url.hostname : `www.${url.hostname}`;
    const sinWww = url.hostname.replace(/^www\./, "");
    return [...new Set([`${url.protocol}//${conWww}`, `${url.protocol}//${sinWww}`])];
  } catch {
    return [frontendUrl];
  }
}

const app = express();
const origenesPermitidos = construirOrigenesPermitidos(env.frontendUrl);

app.use(helmet());
app.use(cors({ origin: origenesPermitidos, credentials: true }));
app.use(express.json());
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

if (env.swagger.password) {
  app.get("/api/docs/login", swaggerLoginPage);
  app.post("/api/docs/login", express.urlencoded({ extended: false }), swaggerLoginSubmit);
  app.post("/api/docs/logout", swaggerLogout);
  app.use(
    "/api/docs",
    helmet({ contentSecurityPolicy: false }),
    swaggerGuard,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );
} else {
  console.warn("SWAGGER_PASSWORD no definido: /api/docs deshabilitado");
}

app.use("/api", apiRateLimiter, router);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Servidor Memora backend escuchando en el puerto ${env.port}`);
});
