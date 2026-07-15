import mysql from "mysql2/promise";

export const db = await mysql.createConnection({
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "2026",
  database: process.env.DB_NAME || "memora",
});