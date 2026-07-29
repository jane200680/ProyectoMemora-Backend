import type { EventEmitter } from "node:events";
import mysql from "mysql2/promise";
import { env } from "./env.js";

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
});

(pool as unknown as EventEmitter).on("error", (error: unknown) => {
  console.error("Error en el pool de MySQL:", error);
});
