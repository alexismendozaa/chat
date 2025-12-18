# Chat UCE – Fullstack Chat (React + Express + Socket.IO)

Repositorio monorepo (backend + frontend + infra) para un chat en tiempo real con autenticación JWT, salas públicas/DMs, subida de imágenes a S3 y persistencia en Postgres + MongoDB.

## Stack
- Backend: Node 20, Express 5, Socket.IO, JWT, bcrypt, Zod, Postgres (usuarios), MongoDB (mensajes), S3 (uploads), Helmet, CORS, Morgan.
- Frontend: React 19 + Vite, socket.io-client, fetch/axios, CSS custom (glassmorphism).
- Infra: Dockerfiles por app, Nginx como reverse proxy, docker-compose para orquestar, imágenes publicadas en Docker Hub.

## Arquitectura rápida
```
[Cliente React] --HTTP/WS--> [Nginx] --HTTP/WS--> [Backend Express]
																						|--> Postgres (users)
																						|--> MongoDB (messages)
																						|--> S3 (archivos)
```

## Componentes principales
- Backend: [apps/backend/src/server.js](apps/backend/src/server.js) monta Express, Socket.IO y conecta Postgres + Mongo.
- Auth: [apps/backend/src/auth](apps/backend/src/auth) (rutas, validación Zod, bcrypt, JWT firmado con `JWT_SECRET`).
- Chat HTTP: [apps/backend/src/chat/chat.routes.js](apps/backend/src/chat/chat.routes.js) sirve historial (Mongo).
- Chat tiempo real: `io` en [apps/backend/src/server.js](apps/backend/src/server.js) maneja `joinRoom` y `message` (guarda y emite a la sala).
- Subidas: [apps/backend/src/uploads/upload.routes.js](apps/backend/src/uploads/upload.routes.js) devuelve URLs S3 (PUT directo + URL pública).
- Modelos: [apps/backend/src/mongo/message.model.js](apps/backend/src/mongo/message.model.js) (mensajes), usuarios en Postgres (`users`).
- Frontend: [apps/frontend/src/App.jsx](apps/frontend/src/App.jsx) orquesta Auth/Chat; vistas en [apps/frontend/src/components](apps/frontend/src/components).
- Infra: [infra/docker-compose.yml](infra/docker-compose.yml) + [infra/nginx.conf](infra/nginx.conf).

## Features
- Registro/login con password hasheado (bcrypt) y JWT de 8h.
- Salas públicas (`general`, `memes`) y DMs dinámicos (`dm-userA-userB`).
- Historial paginado simple (últimos 100 mensajes por sala desde Mongo).
- Mensajes con texto e imagen (upload directo a S3 vía URL prefirmada).
- Estado de conexión en UI, autoguardado de sesión en `localStorage`.

## Variables de entorno
Backend (`apps/backend`)
- `PORT`: puerto del backend (default 3000).
- `CORS_ORIGIN`: lista separada por comas de orígenes permitidos (e.g. `http://localhost:5173`).
- `DATABASE_URL`: URL Postgres (ej. `postgres://user:pass@host:5432/db`).
- `PG_SSL`: `true` para SSL en Postgres.
- `MONGO_URL`: cadena de conexión MongoDB.
- `JWT_SECRET`: secreto para firmar/verificar JWT.
- `AWS_REGION`: región de S3 (ej. `us-east-1`).
- `S3_BUCKET`: bucket donde se guardan imágenes.

Frontend (`apps/frontend`)
- `VITE_BACKEND_URL`: base URL del backend (incluye protocolo y puerto). Se usa para HTTP y Socket.IO.

Docker Compose (`infra/docker-compose.yml`)
- Coloca las variables del backend en un `.env` al lado de `docker-compose.yml`. El frontend toma `BACKEND_URL` desde Nginx.

## Base de datos
- Postgres (tabla `users`):
```sql
CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	username TEXT UNIQUE NOT NULL,
	password_hash TEXT NOT NULL,
	created_at TIMESTAMPTZ DEFAULT now()
);
```
- MongoDB: colección `messages` con `roomId`, `userId`, `username`, `text`, `imageUrl`, `createdAt` (timestamps automáticos).

## Cómo correr en local
Requisitos: Node 20, npm, Postgres, MongoDB.

1) Backend
```
cd apps/backend
npm ci
# exporta variables: DATABASE_URL, MONGO_URL, JWT_SECRET, CORS_ORIGIN, AWS_REGION, S3_BUCKET
npm run dev
```

2) Frontend
```
cd apps/frontend
npm ci
export VITE_BACKEND_URL=http://localhost:3000
npm run dev
```

3) Navega a http://localhost:5173

## Docker / producción
- Imágenes publicadas: `alexismendozaa/chat-backend:latest`, `alexismendozaa/chat-frontend:latest`.
- Para orquestar todo (requiere `.env` con variables del backend):
```
cd infra
docker compose up -d
```
- Nginx expone frontend en 80 y proxya `/api` + `/socket.io` al backend.

## API HTTP
- `GET /health` → estado del backend.
- `POST /api/auth/register` → body `{ username, password }` (Zod valida), crea usuario.
- `POST /api/auth/login` → body `{ username, password }`, responde `{ token }` (expira en 8h).
- `GET /api/chat/rooms/:roomId/messages` (JWT) → últimos 100 mensajes orden ascendente.
- `POST /api/uploads/image` (JWT) → body `{ contentType }` (solo `image/*`), responde `{ uploadUrl, publicUrl }` para subir directo a S3 con `PUT`.

## Eventos Socket.IO
- Autenticación: enviar `auth: { token }` al conectar (mismo JWT de login).
- `joinRoom { roomId }` → se une a la sala y emite `joined`.
- `message { roomId, text?, imageUrl? }` → crea mensaje en Mongo y lo reenvía a la sala como `message` con `{ id, roomId, user, text, imageUrl, createdAt }`.
- Desconexión: log en servidor; cliente muestra estado.

## Flujo de subida de imágenes
1. Cliente llama `POST /api/uploads/image` con `contentType` y token.
2. Backend responde con `uploadUrl` (PUT S3) y `publicUrl`.
3. Cliente hace `PUT` directo al `uploadUrl` y luego envía `message` con `imageUrl=publicUrl`.

## Scripts útiles
- Backend: `npm run dev` (nodemon), `npm start` (prod).
- Frontend: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`.

## Tests
- Backend incluye Jest/Supertest; hay un test de chat en [apps/backend/tests/api/chat.test.js](apps/backend/tests/api/chat.test.js). Ajusta `testApp.js` y datos sembrados para que pasen.

## Limitaciones y pendientes
- No hay expiración de mensajes ni paginación real; solo `limit(100)`.
- La ruta de uploads asume bucket público; no se firma URL temporal.
- Tests de auth vacíos; falta CI/CD.

## Créditos
Proyecto académico (Programación para Dispositivos Móviles).
