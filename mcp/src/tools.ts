import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { adjuntarArchivos, api, getToken, setToken } from "./client.js";

function ok(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data ?? { ok: true }, null, 2) }],
  };
}

function fail(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text", text: message }], isError: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handler(fn: (args: any) => Promise<unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (args: any): Promise<CallToolResult> => {
    try {
      return ok(await fn(args));
    } catch (error) {
      return fail(error);
    }
  };
}

const tipoContenidoEnum = z.enum([
  "Relato escrito",
  "Fotografía",
  "Video",
  "Documento histórico",
  "Receta",
  "Testimonio comunitario",
  "Evento cultural",
  "Lugar recomendado",
]);

export function registerTools(server: McpServer): void {
  // ---------------------------------------------------------------------
  // Sesión / Auth
  // ---------------------------------------------------------------------

  server.tool(
    "auth_register",
    "Registrar un nuevo usuario en Memora. Devuelve el token JWT y lo deja activo para llamadas posteriores.",
    {
      nombre: z.string().min(1).max(100),
      apellido: z.string().min(1).max(150),
      correo: z.string().email().max(255),
      contrasena: z.string().min(8).max(100),
    },
    handler(async (args) => {
      const data = (await api.post("/auth/register", args)) as { token?: string };
      if (data?.token) setToken(data.token);
      return data;
    }),
  );

  server.tool(
    "auth_login",
    "Iniciar sesión en Memora. Guarda el token JWT devuelto para que las siguientes herramientas autenticadas lo usen automáticamente.",
    {
      correo: z.string().email(),
      contrasena: z.string(),
    },
    handler(async (args) => {
      const data = (await api.post("/auth/login", args)) as { token?: string };
      if (data?.token) setToken(data.token);
      return data;
    }),
  );

  server.tool(
    "auth_set_token",
    "Establecer manualmente un token JWT ya existente (por ejemplo, obtenido fuera de este servidor MCP) como sesión activa.",
    { token: z.string().min(1) },
    handler(async ({ token }) => {
      setToken(token);
      return { ok: true };
    }),
  );

  server.tool(
    "auth_logout",
    "Cerrar la sesión activa, olvidando el token JWT guardado en memoria.",
    {},
    handler(async () => {
      setToken(null);
      return { ok: true };
    }),
  );

  server.tool(
    "auth_session_status",
    "Indica si hay una sesión (token JWT) activa en este servidor MCP, sin revelar el token completo.",
    {},
    handler(async () => {
      const token = getToken();
      return token ? { autenticado: true, token_parcial: `${token.slice(0, 8)}...` } : { autenticado: false };
    }),
  );

  server.tool(
    "auth_actualizar_perfil",
    "Actualizar el perfil del usuario autenticado (nombre de usuario, nombre, apellido y opcionalmente una foto de perfil local).",
    {
      nombre_usuario: z.string().min(1),
      nombre: z.string().min(1),
      apellido: z.string().min(1),
      foto_perfil_ruta: z.string().optional().describe("Ruta local absoluta a una imagen para usar como foto de perfil"),
    },
    handler(async ({ foto_perfil_ruta, ...campos }) => {
      const form = new FormData();
      for (const [key, value] of Object.entries(campos as Record<string, unknown>)) {
        form.append(key, String(value));
      }
      await adjuntarArchivos(form, "foto_perfil", foto_perfil_ruta ? [foto_perfil_ruta] : undefined);
      return api.patchForm("/auth/perfil", form, true);
    }),
  );

  server.tool(
    "auth_forgot_password",
    "Solicitar el restablecimiento de contraseña para un correo. Envía instrucciones si el correo existe.",
    { correo: z.string().email() },
    handler(async (args) => api.post("/auth/forgot-password", args)),
  );

  server.tool(
    "auth_reset_password",
    "Restablecer la contraseña usando el token recibido por correo.",
    { token: z.string(), contrasena: z.string().min(8).max(100) },
    handler(async (args) => api.post("/auth/reset-password", args)),
  );

  // ---------------------------------------------------------------------
  // Publicaciones
  // ---------------------------------------------------------------------

  server.tool(
    "publicaciones_feed",
    "Obtener el feed de publicaciones culturales aprobadas, con paginación y filtros opcionales.",
    {
      pagina: z.number().int().positive().optional(),
      limite: z.number().int().positive().max(50).optional(),
      tipo_contenido: z.string().optional(),
      categoria: z.number().int().optional(),
      lugar: z.number().int().optional(),
      anio: z.number().int().optional(),
      q: z.string().optional(),
    },
    handler(async (args) => api.get("/publicaciones", args)),
  );

  server.tool(
    "publicaciones_crear",
    "Crear una publicación cultural (queda en estado Pendiente de revisión). Requiere sesión activa.",
    {
      titulo: z.string().min(3).max(200),
      descripcion: z.string().min(10),
      tipo_contenido: tipoContenidoEnum,
      anio_contenido: z.number().int().optional(),
      categorias: z.array(z.number().int()).optional(),
      lugares: z.array(z.number().int()).optional(),
      archivos_rutas: z
        .array(z.string())
        .max(5)
        .optional()
        .describe("Hasta 5 rutas locales absolutas a archivos multimedia a adjuntar"),
    },
    handler(async ({ archivos_rutas, categorias, lugares, ...campos }) => {
      const form = new FormData();
      for (const [key, value] of Object.entries(campos)) {
        if (value !== undefined) form.append(key, String(value));
      }
      for (const id of categorias ?? []) form.append("categorias", String(id));
      for (const id of lugares ?? []) form.append("lugares", String(id));
      await adjuntarArchivos(form, "archivos", archivos_rutas);
      return api.postForm("/publicaciones", form, true);
    }),
  );

  server.tool(
    "publicaciones_eliminar",
    "Eliminar una publicación propia por id. Requiere sesión activa y ser el dueño de la publicación.",
    { id: z.number().int() },
    handler(async ({ id }) => api.delete(`/publicaciones/${id}`, true)),
  );

  server.tool(
    "publicaciones_obtener_propia",
    "Obtener los datos completos de una publicación propia para editarla. Requiere sesión activa.",
    { id: z.number().int() },
    handler(async ({ id }) => api.get(`/publicaciones/${id}/editar`, undefined, true)),
  );

  server.tool(
    "publicaciones_editar",
    "Editar una publicación propia (vuelve a quedar en estado Pendiente). Requiere sesión activa.",
    {
      id: z.number().int(),
      titulo: z.string().min(3).max(200),
      descripcion: z.string().min(10),
      tipo_contenido: tipoContenidoEnum,
      anio_contenido: z.number().int().optional(),
      categorias: z.array(z.number().int()).optional(),
      lugares: z.array(z.number().int()).optional(),
    },
    handler(async ({ id, ...body }) => api.patch(`/publicaciones/${id}`, body, true)),
  );

  server.tool(
    "publicaciones_reaccionar",
    "Alternar (dar/quitar like) una reacción sobre una publicación. Requiere sesión activa.",
    { id: z.number().int() },
    handler(async ({ id }) => api.post(`/publicaciones/${id}/reacciones`, undefined, true)),
  );

  server.tool(
    "publicaciones_listar_comentarios",
    "Listar los comentarios (con respuestas anidadas) de una publicación. No requiere sesión.",
    { id: z.number().int() },
    handler(async ({ id }) => api.get(`/publicaciones/${id}/comentarios`)),
  );

  server.tool(
    "publicaciones_crear_comentario",
    "Crear un comentario, o una respuesta a otro comentario, en una publicación. Requiere sesión activa.",
    {
      id: z.number().int(),
      contenido: z.string().min(1),
      id_comentario_padre: z.number().int().optional(),
    },
    handler(async ({ id, ...body }) => api.post(`/publicaciones/${id}/comentarios`, body, true)),
  );

  // ---------------------------------------------------------------------
  // Catálogos (público)
  // ---------------------------------------------------------------------

  server.tool(
    "catalogos_listar_categorias",
    "Listar las categorías culturales disponibles (público).",
    {},
    handler(async () => api.get("/catalogos/categorias")),
  );

  server.tool(
    "catalogos_listar_lugares",
    "Listar los lugares culturales disponibles (público).",
    {},
    handler(async () => api.get("/catalogos/lugares")),
  );

  // ---------------------------------------------------------------------
  // Notificaciones
  // ---------------------------------------------------------------------

  server.tool(
    "notificaciones_listar",
    "Listar las notificaciones del usuario autenticado, incluyendo el conteo de no leídas. Requiere sesión activa.",
    {},
    handler(async () => api.get("/notificaciones", undefined, true)),
  );

  server.tool(
    "notificaciones_marcar_todas_leidas",
    "Marcar todas las notificaciones del usuario autenticado como leídas. Requiere sesión activa.",
    {},
    handler(async () => api.patch("/notificaciones/leidas", undefined, true)),
  );

  server.tool(
    "notificaciones_marcar_leida",
    "Marcar una notificación específica como leída. Requiere sesión activa.",
    { id: z.number().int() },
    handler(async ({ id }) => api.patch(`/notificaciones/${id}/leida`, undefined, true)),
  );

  // ---------------------------------------------------------------------
  // Administración (requiere rol Administrador)
  // ---------------------------------------------------------------------

  server.tool(
    "admin_listar_usuarios",
    "Listar todos los usuarios registrados. Requiere sesión activa con rol Administrador.",
    {},
    handler(async () => api.get("/admin/usuarios", undefined, true)),
  );

  server.tool(
    "admin_cambiar_estado_usuario",
    "Cambiar el estado (por ejemplo activo/inactivo) de un usuario. Requiere rol Administrador.",
    { id: z.number().int(), estado: z.string() },
    handler(async ({ id, estado }) => api.patch(`/admin/usuarios/${id}/estado`, { estado }, true)),
  );

  server.tool(
    "admin_listar_publicaciones_pendientes",
    "Listar las publicaciones pendientes de revisión. Requiere rol Administrador.",
    {},
    handler(async () => api.get("/admin/publicaciones/pendientes", undefined, true)),
  );

  server.tool(
    "admin_cambiar_estado_publicacion",
    "Aprobar o rechazar una publicación pendiente. Requiere rol Administrador.",
    { id: z.number().int(), estado: z.enum(["Aprobada", "Rechazada"]) },
    handler(async ({ id, estado }) => api.patch(`/admin/publicaciones/${id}/estado`, { estado }, true)),
  );

  server.tool(
    "admin_crear_categoria",
    "Crear una categoría cultural. Requiere rol Administrador.",
    { nombre: z.string().min(1) },
    handler(async (body) => api.post("/admin/categorias", body, true)),
  );

  server.tool(
    "admin_actualizar_categoria",
    "Actualizar el nombre de una categoría cultural. Requiere rol Administrador.",
    { id: z.number().int(), nombre: z.string().min(1) },
    handler(async ({ id, ...body }) => api.put(`/admin/categorias/${id}`, body, true)),
  );

  server.tool(
    "admin_eliminar_categoria",
    "Eliminar una categoría cultural. Requiere rol Administrador.",
    { id: z.number().int() },
    handler(async ({ id }) => api.delete(`/admin/categorias/${id}`, true)),
  );

  server.tool(
    "admin_crear_lugar",
    "Crear un lugar cultural. Requiere rol Administrador.",
    { nombre: z.string().min(1) },
    handler(async (body) => api.post("/admin/lugares", body, true)),
  );

  server.tool(
    "admin_actualizar_lugar",
    "Actualizar el nombre de un lugar cultural. Requiere rol Administrador.",
    { id: z.number().int(), nombre: z.string().min(1) },
    handler(async ({ id, ...body }) => api.put(`/admin/lugares/${id}`, body, true)),
  );

  server.tool(
    "admin_eliminar_lugar",
    "Eliminar un lugar cultural. Requiere rol Administrador.",
    { id: z.number().int() },
    handler(async ({ id }) => api.delete(`/admin/lugares/${id}`, true)),
  );
}
