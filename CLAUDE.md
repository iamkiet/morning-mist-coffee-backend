# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # tsx watch on src/server.ts
npm run build        # tsc -> dist/
npm start            # node dist/server.js (after build)
npm run typecheck    # tsc --noEmit  (no test runner is configured)
npm run lint         # eslint .
npm run check:dead   # knip — dead code detection
npm run check:arch   # validate clean architecture boundaries

npm run db:push      # dev: push schema directly to Postgres
npm run db:generate  # generate SQL migration from schema diff
npm run db:migrate   # apply pending migrations
npm run db:studio    # Drizzle Studio
```

Local Postgres: `docker compose up -d pg-db` (exposes 5432, db `app`, user/pass `postgres`).

Node >= 22 is required (ESM, top-level `crypto`, etc.).

## Architecture

Clean architecture. Inner layers must not import from outer layers (enforced by [.claude/check-architecture.sh](.claude/check-architecture.sh), which also runs automatically as a Stop hook).

```
domain/          entities, repo interfaces, ports — no framework, no I/O
application/     use cases — depend only on domain abstractions
infrastructure/  Drizzle repos, adapters, db client — implements domain ports
presentation/    Fastify routes/controllers/schemas/serializers/plugins — the only Fastify-aware code
```

**Domains:** `user`, `auth` (refresh token), `product`, `product-type`, `order`

**Fastify plugin wiring** (src/presentation/plugins/):

- `dbPlugin` → decorates `app.db`
- `authPlugin` → decorates `app.authenticate` and `app.requireRole`
- `servicesPlugin` (depends on db) → instantiates all repos, adapters, use cases; decorates `app.useCases` and `app.tokenSigner`

**Auth flow:** JWT access tokens (HS256) + JTI-based refresh tokens stored in DB. Access token accepted via Bearer header or cookie. Routes protected with `app.authenticate` or `app.requireRole()`.

## Conventions

- **ESM**: relative imports end in `.js` (NodeNext), even though source is `.ts`.
- **Strict TS**: `noUncheckedIndexedAccess` is on — array/index access returns `T | undefined`; guard before use.
- **Errors**: throw `AppError` subclasses from [src/lib/errors.ts](src/lib/errors.ts) (`NotFoundError`, `ConflictError`, `ValidationError`, `ForbiddenError`, `UnauthorizedError`, `ExternalServiceError`). Never plain `Error` for client-facing errors.
- **Env**: import the validated `env` from [src/config/env.ts](src/config/env.ts). Never read `process.env` directly. No defaults, no `?? fallback`, no `if (NODE_ENV === 'production')` — use explicit toggle env vars.
- **Domain purity**: `domain/` must be deterministic — no `Date.now()`, `new Date()` (no args), `Math.random()`, `crypto.randomUUID()`. Pass time/ids in from caller.
- **DB casing**: schema uses snake_case columns; Drizzle maps to camelCase automatically (`casing: 'snake_case'`).

## Code style

- Files stay small — split when a file exceeds ~150 lines
- Names are self-explanatory — no comments of any kind
- One responsibility per file — if you need "and" to describe it, split it

## Skills

- Use `add-feature` skill when adding any new feature end-to-end
- Use `self-review` skill after every task before reporting done
