# memora-mcp

Servidor [MCP](https://modelcontextprotocol.io) (stdio) que expone la API REST de Memora
(descrita en `backend/src/routes/*.ts` mediante anotaciones `@openapi` y servida en
`/api-docs` por `swagger-jsdoc` + `swagger-ui-express`) como herramientas invocables por
un cliente MCP (Claude Desktop, Claude Code, etc.).

## Instalación

```bash
cd backend/mcp
npm install
npm run build
```

## Configuración

Copia `.env.example` a `.env` y ajusta si hace falta:

```env
MEMORA_API_URL=http://localhost:3000/api
MEMORA_API_TOKEN=
```

- `MEMORA_API_URL`: base de la API de Memora (el backend debe estar corriendo).
- `MEMORA_API_TOKEN`: opcional, permite arrancar ya autenticado. También puedes
  autenticarte en tiempo de ejecución con las herramientas `auth_login` / `auth_register`
  / `auth_set_token`; el token queda en memoria del proceso del servidor MCP.

## Ejecutar

```bash
npm run dev     # con tsx, sin compilar
npm start        # tras npm run build
```

## Conectarlo a un cliente MCP

Ejemplo de configuración para Claude Desktop / Claude Code (`claude_desktop_config.json`
o equivalente):

```json
{
  "mcpServers": {
    "memora": {
      "command": "node",
      "args": ["ruta/al/proyecto/backend/mcp/dist/index.js"],
      "env": {
        "MEMORA_API_URL": "http://localhost:3000/api"
      }
    }
  }
}
```

## Herramientas expuestas

Cada herramienta llama a un endpoint de la API de Memora vía `fetch`.

**Auth / sesión** — `auth_register`, `auth_login`, `auth_set_token`, `auth_logout`,
`auth_session_status`, `auth_actualizar_perfil`, `auth_forgot_password`, `auth_reset_password`.

**Publicaciones** — `publicaciones_feed`, `publicaciones_crear`, `publicaciones_eliminar`,
`publicaciones_obtener_propia`, `publicaciones_editar`, `publicaciones_reaccionar`,
`publicaciones_listar_comentarios`, `publicaciones_crear_comentario`.

**Catálogos (público)** — `catalogos_listar_categorias`, `catalogos_listar_lugares`.

**Notificaciones** — `notificaciones_listar`, `notificaciones_marcar_todas_leidas`,
`notificaciones_marcar_leida`.

**Admin** (requieren sesión con rol `Administrador`) — `admin_listar_usuarios`,
`admin_cambiar_estado_usuario`, `admin_listar_publicaciones_pendientes`,
`admin_cambiar_estado_publicacion`, `admin_crear_categoria`, `admin_actualizar_categoria`,
`admin_eliminar_categoria`, `admin_crear_lugar`, `admin_actualizar_lugar`,
`admin_eliminar_lugar`.

Las herramientas marcadas como autenticadas requieren haber llamado antes a `auth_login`
(o `auth_set_token`); el token JWT se guarda en memoria mientras el proceso del servidor
MCP siga vivo.

`publicaciones_crear` y `auth_actualizar_perfil` aceptan rutas de archivo locales
(`archivos_rutas`, `foto_perfil_ruta`) que se leen del disco y se envían como
`multipart/form-data`.
