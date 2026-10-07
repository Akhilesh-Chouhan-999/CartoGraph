# CartoGraph

CartoGraph maps JavaScript and TypeScript dependencies in public GitHub repositories. Static analysis builds the dependency graph; AI features explain verified graph and file data.

## Backend

The Express 5 API is in `server/`. It uses TypeScript, MongoDB/Mongoose, Redis/BullMQ, Zod validation, and Vitest. Repository analysis runs in a background worker and does not execute repository code.

### Local setup

1. Install Node.js 22 and MongoDB and Redis, or start the services with Docker Compose.
2. Copy `server/.env.example` to `server/.env` and set `JWT_SECRET` to a private value of at least 32 characters. Add GitHub and OpenAI credentials if those integrations are needed.
3. Install backend dependencies and start the development server:

   ```sh
   cd server
   npm install
   npm run dev
   ```

The API listens on port `5000` by default. `GET /health` is a public health check. See `server/.env.example` for the supported configuration variables. Do not commit `server/.env`.

### Useful commands

Run these from `server/`:

```sh
npm run check
npm run test
npm run build
```

## Authentication

Authentication is implemented by `AuthService` in [`server/src/services/auth.service.ts`](server/src/services/auth.service.ts), with HTTP handling in `AuthController` and bearer-token verification in `AuthMiddleware`.

### Endpoints

| Method | Path | Purpose | Authentication |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account and return a token | No |
| `POST` | `/api/auth/login` | Verify credentials and return a token | No |
| `POST` | `/api/auth/logout` | Revoke the current token | Bearer token |
| `GET` | `/api/auth/me` | Return the current user's safe profile | Bearer token |

Register request:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "a-long-password"
}
```

Login request:

```json
{
  "email": "ada@example.com",
  "password": "a-long-password"
}
```

Successful registration and login return the safe user fields (`id`, `name`, and `email`) together with a signed JWT. Passwords are hashed with bcrypt before storage; `passwordHash` is never included in the response. Email addresses are trimmed and normalized to lowercase. Request bodies are validated with Zod.

Send the returned token on protected requests:

```http
Authorization: Bearer <token>
```

Tokens use the configured `JWT_SECRET` and `JWT_EXPIRES_IN`. Each token has a unique ID; logout stores that ID in Redis until the token expires, and protected requests reject revoked tokens. If Redis is unavailable, authentication fails closed.

API responses use the standard envelope:

```json
{
  "success": true,
  "data": {}
}
```

Errors return `success: false` and a message. The global error middleware handles validation, authentication, and application errors.
