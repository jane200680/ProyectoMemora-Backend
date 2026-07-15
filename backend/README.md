# MEMORA - Backend

Backend desarrollado con Node.js, Express y MySQL para la plataforma MEMORA.

## Tecnologías utilizadas

- Node.js
- Express
- MySQL
- MySQL2
- bcryptjs
- CORS

---

## Instalación

Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
```

Ingresar al proyecto

```bash
cd backend
```

Instalar dependencias

```bash
npm install
```

---

## Configuración

Crear la base de datos en MySQL ejecutando el script generado desde MySQL Workbench.

Modificar el archivo

```
config/db.js
```

con los datos de conexión correspondientes.

Ejemplo:

```javascript
host: "localhost",
user: "root",
password: "tu_password",
database: "memora"
```

---

## Ejecutar el servidor

Modo desarrollo

```bash
npm run dev
```

o

```bash
node server.js
```

El servidor iniciará en

```
http://localhost:3000
```

---

## Endpoints implementados

### Registrar usuario

```
POST /api/register
```

Campos requeridos

```json
{
  "nombre_usuario": "janeee_mc",
  "nombre": "Janneth",
  "apellido": "Medina",
  "correo": "jannethmedina144@gmail.com",
  "contrasena": "12345"
}
```

---

### Iniciar sesión

```
POST /api/login
```

```json
{
  "correo": "jannethmedina144@gmail.com",
  "contrasena": "12345"
}
```

---

## Base de datos

La base de datos está compuesta por las siguientes entidades:

- usuario
- autenticacion
- publicacion_cultural
- archivo_multimedia
- comentario
- categoria_cultural
- lugar_cultural
- notificacion

---

## Autor

Proyecto Integrador

Universidad Internacional del Ecuador

Carrera de Ingeniería en Tecnologías de la Información