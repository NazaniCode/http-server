# http-server

A small **Chirpy**-style HTTP API built for [Boot.dev](https://boot.dev): user accounts with password hashing (Argon2), short posts (“chirps”), JWT access tokens, refresh-token rotation, and a Polka payment webhook integration. It uses **Express 5**, **TypeScript**, **Drizzle ORM**, and **PostgreSQL**.

The server listens on **port `8080`**. Requests under `/app` are served static files from `src/app/` and increment an internal hit counter used by admin metrics.

## Prerequisites

- Node.js with npm  
- PostgreSQL database URL reachable from your machine  

## Configuration

Variables are loaded from a `.env` file (via `process.loadEnvFile()` in Node):

| Variable     | Purpose |
|-------------|---------|
| `DB_URL`    | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `PLATFORM` | Environment tag; **`dev`** unlocks destructive admin routes |
| `POLKA_KEY` | Shared secret for the Polka webhook (sent as ApiToken token in `Authorization`) |

## Scripts

```bash
npm run build    # Compile TypeScript to dist/
npm run start    # Run dist/index.js
npm run dev      # build + start
npm run generate # Drizzle generate new db
npm run migrate  # Drizzle migrations
npm run test     # Vitest
```

On startup the app runs Drizzle migrations from `src/db/migrations/` before accepting traffic.

---

## Authentication

- **Bearer JWT**: `Authorization: Bearer <access_token>`  
  - Issued by `POST /api/login` or `POST /api/refresh`  
  - Access tokens expire after **one hour**
- **Refresh token**: Same header format (`Bearer <refresh_token>`) on `/api/refresh` and `/api/revoke`
- Errors from the JSON API commonly use `{ "error": "message" }` with HTTP 400 / 401 / 403 / 404 as applicable

---

## API reference

Unless noted, responses are JSON and `Content-Type: application/json`.

### Health & static

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/healthz` | Readiness probe; responds with plain text `OK` |

Static assets are mounted at **`/app`** (relative to `./src/app`).

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/users` | — | Register: body `{ "email": string, "password": string }`. **201** with user (`id`, `email`, `createdAt`, `updatedAt`, `isChirpyRed`). |
| `GET` | `/api/users` | — | List all users (array). **200** |
| `PUT` | `/api/users` | Bearer access JWT | Update the authenticated user: body `{ "email": string, "password": string }` (password is re-hashed). **200** with updated user. |

### Auth & tokens

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/login` | — | Body `{ "email": string, "password": string }`. **200** with user fields plus `token` (JWT) and `refreshToken`. **401** if credentials invalid. |
| `POST` | `/api/refresh` | Bearer refresh token | **200** `{ "token": "<new access JWT>" }`. **401** if token missing, revoked, or expired (~60 days from creation). |
| `POST` | `/api/revoke` | Bearer refresh token | Revokes the refresh token. **204** on success; **401** if invalid. |

### Chirps

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/chirps` | Bearer access JWT | Body `{ "body": string }`; max length **140** characters. **201** with chirp (`id`, `createdAt`, `updatedAt`, `body`, `userId`). |
| `GET` | `/api/chirps` | — | **200** lists all chirps, or **`?authorId=<user uuid>`** to filter by author. |
| `GET` | `/api/chirps/:chirpId` | — | **200** single chirp; **404** if missing. |
| `DELETE` | `/api/chirps/:chirpId` | Bearer access JWT | Deletes chirp only if it belongs to the JWT subject. **204** success; **403** wrong user; **404** not found. |

### Admin (metrics & reset)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/metrics` | **HTML** page showing total visits to `/app` (hits counter). |
| `POST` | `/admin/reset` | Resets stored users (and resets the hit counter). Allowed only when `PLATFORM` is **`dev`**; otherwise **403**. **200** with plain text `OK` on success. |

### Webhooks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/polka/webhooks` | `Authorization: Bearer <POLKA_KEY>` | Expects JSON with `event: "user.upgraded"` and `data.userId` (string). Marks that user upgraded (e.g. “Chirpy Red”). Wrong event may still return **204** without upgrading; unknown user **404**. |

---

## Error handling notes

Unhandled server errors typically yield **500** with an empty body; client errors map to **`BadRequestsError` → 400**, **`UnauthorizedError` → 401**, **`ForbiddenError` → 403**, **`NotFoundError` → 404** as implemented in `src/index.ts`.
