# backend

Modern Fastify + TypeScript backend with an n-tier layout. Drizzle ORM (PostgreSQL), TypeBox schemas, OpenAI adapter, OpenAPI docs.

## Stack

- **Runtime**: Node.js 22+, ESM, TypeScript 5.7
- **HTTP**: Fastify 5 + `@fastify/type-provider-typebox` (compile-time + runtime types from one schema)
- **Validation**: TypeBox (request/response), Zod (env)
- **DB**: PostgreSQL via Drizzle ORM 0.38 (`postgres-js` driver)
- **External**: OpenAI SDK
- **Docs**: `@fastify/swagger` → `/docs`
- **Security**: `@fastify/helmet`, `@fastify/cors`

## Layout

```
src/
  server.ts            entry — bootstraps app + signals
  app.ts               builds Fastify, registers plugins, error handler
  config/env.ts        Zod-validated env
  db/
    client.ts          drizzle + postgres-js connection
    schema.ts          drizzle tables (orders)
  lib/
    errors.ts          AppError taxonomy
    openai.ts          OpenAI client
  types/               row → DTO mappers
  schemas/             TypeBox request/response schemas
  repositories/        SQL only (drizzle)
  adapters/            external API wrappers
  services/            business logic
  controllers/         req/res glue
  routes/              endpoint registration + DI
  middlewares/auth.ts  bearer auth hook
drizzle.config.ts
```

Flow: `routes → controllers → services → repos/adapters → clients`

## Setup

```bash
cp .env.example .env       # fill in DATABASE_URL + generated secrets (see below)
npm install
npm run db:push            # create tables in dev (or db:generate + db:migrate)
npm run dev                # http://localhost:3000  ·  docs at /docs
```

## Secrets to generate

The app refuses to boot if any of these are missing or too short. Generate fresh values per environment — never reuse dev secrets in prod.

| Env var                 | Purpose                                                                    | How to generate                                                                  | Requirement  |
| ----------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------ |
| `AUTH_JWT_SECRET`       | HMAC key for signing access + refresh JWTs (HS256)                         | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` | min 32 chars |
| `USER_REGISTRATION_KEY` | Gate for `POST /api/v1/auth/register` via `X-User-Registration-Key` header | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` | min 32 chars |

Both use `crypto.randomBytes` → cryptographically random, base64url encoded (URL/header-safe, no padding). 32 bytes = 256-bit entropy.

Comparison is timing-safe (`crypto.timingSafeEqual`) for the registration key, and JWT signature verify (constant-time) for the JWT secret.

## Scripts

| Script                | Purpose                             |
| --------------------- | ----------------------------------- |
| `npm run dev`         | tsx watch mode                      |
| `npm run build`       | TypeScript build to `dist/`         |
| `npm start`           | run compiled `dist/server.js`       |
| `npm run typecheck`   | `tsc --noEmit`                      |
| `npm run db:generate` | generate SQL migrations from schema |
| `npm run db:migrate`  | apply migrations                    |
| `npm run db:push`     | push schema directly (dev)          |
| `npm run db:studio`   | drizzle studio                      |

## Endpoints

All routes require `Authorization: Bearer <AUTH_JWT_SECRET>` (placeholder verifier in [src/middlewares/auth.ts](src/middlewares/auth.ts) — swap in `@fastify/jwt` or `jose` for production).

- `GET    /health`
- `GET    /docs` — Swagger UI
- `GET    /api/v1/orders`
- `POST   /api/v1/orders`
- `GET    /api/v1/orders/:id`
- `PATCH  /api/v1/orders/:id/status` — enforces a state machine

## Swapping HTTP layer

The HTTP boundary (`server.ts`, `app.ts`, `routes/`) is the only Fastify-aware code. Controllers receive request/reply types but the underlying logic in `services/` and below is framework-agnostic — port routes to Hono/Express without touching business logic.
