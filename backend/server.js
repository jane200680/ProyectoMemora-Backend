import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "./config/db.js";
import "dotenv/config";

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "memora_secret_key";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    message: "Demasiados intentos. Intenta nuevamente en 15 minutos.",
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
  message: "Límite de solicitudes alcanzado. Intenta nuevamente más tarde.",
},
});

app.use(cors());
app.use(express.json());
app.use("/api", apiLimiter);

const registerSchema = z.object({
  nombre_usuario: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres.'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres.'),
  correo: z.string().email('Ingresa un correo electrónico válido.'),
  contrasena: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

const loginSchema = z.object({
  correo: z.string().email('Ingresa un correo electrónico válido.'),
  contrasena: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

const publicacionSchema = z.object({
  titulo: z.string().min(5),
  descripcion: z.string().min(10),
  tipo_contenido: z.enum([
    "Relato escrito",
    "Fotografía",
    "Video",
    "Audio",
    "Documento histórico",
    "Receta",
    "Testimonio comunitario",
    "Evento cultural",
    "Lugar recomendado",
  ]),
  anio_contenido: z
    .string()
    .regex(/^\d{4}$/, "Año debe tener 4 dígitos")
    .optional(),
});

const publicacionUpdateSchema = publicacionSchema.partial().extend({
  estado: z.enum(["Pendiente", "Aprobada", "Rechazada"]).optional(),
});

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id_usuario,       
      email: user.correo,         
      rol: user.rol,
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  jwt.verify(token, JWT_SECRET, (error, usuario) => {
    if (error) {
      console.error("ERROR DETECTADO EN EL TOKEN:", error.message); 

      return res.status(401).json({ message: "Token inválido" });
    }

    req.user = usuario;
    next();
  });
}

function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ message: "No tienes permiso para realizar esta acción" });
    }
    next();
  };
}

app.post("/api/register", authLimiter, async (req, res) => {
  const parseResult = registerSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: parseResult.error.errors.map((err) => err.message).join(", ") });
  }

  const { nombre_usuario, nombre, apellido, correo, contrasena } = parseResult.data;

  try {
    const [existe] = await db.execute(
      "SELECT id_usuario FROM usuario WHERE correo = ? OR nombre_usuario = ?",
      [correo, nombre_usuario]
    );

    if (existe.length > 0) {
      return res.status(409).json({ message: "Correo o usuario ya registrado" });
    }

    const hash = await bcrypt.hash(contrasena, 10);

    const [result] = await db.execute(
      `INSERT INTO usuario (nombre_usuario, nombre, apellido, correo)
       VALUES (?, ?, ?, ?)`,
      [nombre_usuario, nombre, apellido, correo]
    );

    await db.execute(
      `INSERT INTO autenticacion (contrasena_hash, usuario_id_usuario)
       VALUES (?, ?)`,
      [hash, result.insertId]
    );

    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

app.post("/api/login", authLimiter, async (req, res) => {
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: parseResult.error.errors.map((err) => err.message).join(", ") });
  }

  const { correo, contrasena } = parseResult.data;

  try {
    const [rows] = await db.execute(
      `SELECT
        u.id_usuario,
        u.nombre_usuario,
        u.nombre,
        u.apellido,
        u.correo,
        u.rol,
        a.contrasena_hash
      FROM usuario u
      INNER JOIN autenticacion a
      ON u.id_usuario = a.usuario_id_usuario
      WHERE u.correo = ?`,
      [correo]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Correo o contraseña incorrectos" });
    }

    const usuario = rows[0];
    const coincide = await bcrypt.compare(contrasena, usuario.contrasena_hash);

    if (!coincide) {
      return res.status(401).json({ message: "Correo o contraseña incorrectos" });
    }

    const token = generateToken(usuario);

    res.json({
      message: "Inicio de sesión correcto",
      token,
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        usuario: usuario.nombre_usuario,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

app.get("/api/usuario", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
        id_usuario AS id, 
        nombre_usuario, 
        nombre, 
        apellido, 
        correo, 
        rol 
      FROM usuario`
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los usuarios" });
  }
});

app.get("/api/publicaciones", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id_publicacion, titulo, descripcion, fecha_publicacion, tipo_contenido, estado, id_usuario, anio_contenido
       FROM publicacion_cultural`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener publicaciones" });
  }
});

app.get("/api/publicaciones/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT id_publicacion, titulo, descripcion, fecha_publicacion, tipo_contenido, estado, id_usuario, anio_contenido
       FROM publicacion_cultural
       WHERE id_publicacion = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la publicación" });
  }
});

app.post("/api/publicaciones", authenticateToken, async (req, res) => {
  const parseResult = publicacionSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: parseResult.error.errors.map((err) => err.message).join(", ") });
  }

  const { titulo, descripcion, tipo_contenido, anio_contenido } = parseResult.data;

  try {
    const [result] = await db.execute(
      `INSERT INTO publicacion_cultural (titulo, descripcion, tipo_contenido, id_usuario, anio_contenido)
       VALUES (?, ?, ?, ?, ?)`,
      [titulo, descripcion, tipo_contenido, req.user.id, anio_contenido || null]
    );

    const [createdRow] = await db.execute(
      `SELECT id_publicacion, titulo, descripcion, fecha_publicacion, tipo_contenido, estado, id_usuario, anio_contenido
       FROM publicacion_cultural
       WHERE id_publicacion = ?`,
      [result.insertId]
    );

    res.status(201).json(createdRow[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear la publicación" });
  }
});

app.put("/api/publicaciones/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const parseResult = publicacionUpdateSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: parseResult.error.errors.map((err) => err.message).join(", ") });
  }

  try {
    const [existingRows] = await db.execute(
      `SELECT id_publicacion, id_usuario FROM publicacion_cultural WHERE id_publicacion = ?`,
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    const publicacion = existingRows[0];
    const canEdit = req.user.rol === "Administrador" || req.user.id === publicacion.id_usuario;

    if (!canEdit) {
      return res.status(403).json({ message: "No tienes permiso para actualizar esta publicación" });
    }

    const updates = parseResult.data;
    const fields = [];
    const values = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ message: "No se proporcionaron datos para actualizar" });
    }

    values.push(id);

    await db.execute(
      `UPDATE publicacion_cultural SET ${fields.join(", ")} WHERE id_publicacion = ?`,
      values
    );

    const [updatedRows] = await db.execute(
      `SELECT id_publicacion, titulo, descripcion, fecha_publicacion, tipo_contenido, estado, id_usuario, anio_contenido
       FROM publicacion_cultural
       WHERE id_publicacion = ?`,
      [id]
    );

    res.json(updatedRows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar la publicación" });
  }
});

app.delete("/api/publicaciones/:id", authenticateToken, authorizeRole("Administrador"), async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT id_publicacion FROM publicacion_cultural WHERE id_publicacion = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    await db.execute(`DELETE FROM publicacion_cultural WHERE id_publicacion = ?`, [id]);
    res.json({ message: "Publicación eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar la publicación" });
  }
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});