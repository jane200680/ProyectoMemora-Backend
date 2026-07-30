import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";

const servidorProduccion = "https://www.findmemora.com";
const servidorLocal = `http://localhost:${env.port}`;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Memora API",
      version: "1.0.0",
      description:
        "API REST del sistema Memora: autenticación, publicaciones culturales, catálogos, notificaciones y panel de administrador.",
    },
    servers: [
      { url: `${servidorProduccion}/api`, description: "Producción" },
      { url: `${servidorLocal}/api`, description: "Local" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        RegisterInput: {
          type: "object",
          required: ["nombre", "apellido", "correo", "contrasena"],
          properties: {
            nombre: { type: "string", minLength: 1, maxLength: 100 },
            apellido: { type: "string", minLength: 1, maxLength: 150 },
            correo: { type: "string", format: "email", maxLength: 255 },
            contrasena: { type: "string", minLength: 8, maxLength: 100 },
          },
        },
        LoginInput: {
          type: "object",
          required: ["correo", "contrasena"],
          properties: {
            correo: { type: "string", format: "email" },
            contrasena: { type: "string" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            usuario: {
              type: "object",
              properties: {
                id_usuario: { type: "integer" },
                nombre_usuario: { type: "string" },
                nombre: { type: "string" },
                apellido: { type: "string" },
                correo: { type: "string" },
                rol: { type: "string" },
              },
            },
          },
        },
        Publicacion: {
          type: "object",
          properties: {
            id_publicacion: { type: "integer" },
            titulo: { type: "string" },
            descripcion: { type: "string" },
            tipo_contenido: { type: "string" },
            anio_contenido: { type: "integer", nullable: true },
            estado: { type: "string", enum: ["Pendiente", "Aprobada", "Rechazada"] },
          },
        },
        CrearPublicacionInput: {
          type: "object",
          required: ["titulo", "descripcion", "tipo_contenido"],
          properties: {
            titulo: { type: "string", minLength: 3, maxLength: 200 },
            descripcion: { type: "string", minLength: 10 },
            tipo_contenido: {
              type: "string",
              enum: [
                "Relato escrito",
                "Fotografía",
                "Video",
                "Documento histórico",
                "Receta",
                "Testimonio comunitario",
                "Evento cultural",
                "Lugar recomendado",
              ],
            },
            anio_contenido: { type: "integer" },
            categorias: { type: "array", items: { type: "integer" } },
            lugares: { type: "array", items: { type: "integer" } },
            archivos: {
              type: "array",
              items: { type: "string", format: "binary" },
              maxItems: 5,
            },
          },
        },
        Categoria: {
          type: "object",
          properties: {
            id_categoria: { type: "integer" },
            nombre: { type: "string" },
          },
        },
        Lugar: {
          type: "object",
          properties: {
            id_lugar: { type: "integer" },
            nombre: { type: "string" },
          },
        },
        Comentario: {
          type: "object",
          properties: {
            id_comentario: { type: "integer" },
            id_publicacion: { type: "integer" },
            id_comentario_padre: { type: "integer", nullable: true },
            contenido: { type: "string" },
            fecha_creacion: { type: "string", format: "date-time" },
          },
        },
        Notificacion: {
          type: "object",
          properties: {
            id: { type: "integer" },
            mensaje: { type: "string" },
            leida: { type: "boolean" },
            fecha: { type: "string", format: "date-time" },
            idPublicacion: { type: "integer" },
            tipo: {
              type: "string",
              enum: ["comentario", "reaccion", "estado", "otro"],
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./dist/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
