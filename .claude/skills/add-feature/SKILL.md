---
name: add-feature
description: End-to-end guide for adding a new feature. Use when creating new domain entity, use case, repository, route, or any full-stack feature addition.
---

# Adding a new feature

## Composition root

All wiring happens in [src/presentation/plugins/services.plugin.ts](../../../src/presentation/plugins/services.plugin.ts). It instantiates concrete repos/adapters and constructs use cases, then decorates the Fastify instance with `app.useCases`. Plugin order is enforced by `fastify-plugin` dependencies: `db` → `auth` → `services`. Routes pull use cases off `app.useCases` and pass them into controllers.

## End-to-end recipe

1. `domain/<feature>/<feature>.entity.ts` — types + pure business rules (e.g., `canTransition` in [src/domain/order/order.entity.ts](../../../src/domain/order/order.entity.ts)).
2. `domain/<feature>/<feature>.repo.ts` — the repository **interface** (used by use cases).
3. `application/<feature>/<verb>-<feature>.use-case.ts` — one class per use case, constructor-injected deps, single `execute` method.
4. `infrastructure/repositories/<feature>.repository.ts` — Drizzle implementation `implements <Feature>Repo`.
5. `presentation/schemas/<feature>.schema.ts` — Zod schemas for body/params/query/response.
6. `presentation/serializers/<feature>.serializer.ts` — `Entity -> DTO` mapping (handles `Date -> ISO string` etc.). DTOs are derived from the Zod schemas.
7. `presentation/controllers/<feature>.controller.ts` — thin glue between request and use case.
8. `presentation/routes/<feature>.routes.ts` — registers routes, attaches `onRequest: app.authenticate`, declares Zod schemas in `schema:` so OpenAPI + validation are derived from the same source.
9. Register the new use cases in `services.plugin.ts` and the new route module in `app.ts`.

## Conventions for feature work

- **External calls go through ports**: do not call third-party services from use cases directly. Define a port in `domain/ports/`, implement it in `infrastructure/adapters/`, inject it. Adapters wrap upstream errors in `ExternalServiceError`.
- **Status state machines** (and similar invariants) belong in the domain entity as a pure function, then enforced by the relevant use case before calling the repo — see `canTransition` + `UpdateOrderStatusUseCase`.
- **DB**: Drizzle with `casing: 'snake_case'` — TS field `customerId` maps to column `customer_id` automatically; do not write the snake_case names in entity types. `updatedAt` auto-updates via `$onUpdate`. Schema lives in [src/infrastructure/db/schema.ts](../../../src/infrastructure/db/schema.ts); changes need `db:generate` + `db:migrate` (or `db:push` in dev).
- **Pagination/sort**: list endpoints share helpers from [presentation/schemas/\_pagination.ts](../../../src/presentation/schemas/_pagination.ts) (`paginationFields`, `sortFields([...])`, `paginatedResponse(item)`) and the domain `Paginated<T>` + `mapPaginated` in [domain/shared/pagination.ts](../../../src/domain/shared/pagination.ts).
- **Auth**: real JWT (HS256) via [jose.token-signer.ts](../../../src/infrastructure/adapters/jose.token-signer.ts). Access (15m) + refresh (30d) tokens, refresh stored in `refresh_tokens` table with rotation on use. Auth middleware ([auth.ts](../../../src/presentation/middlewares/auth.ts)) reads from `Authorization: Bearer` header OR the `access_token` HttpOnly cookie. All `/api/v1/*` routes (except `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`) attach `app.authenticate` as an `onRequest` hook.
- **Logging**: use `req.log` inside route handlers/controllers, `app.log` at the app level, and `import { logger } from './lib/logger.js'` for bootstrap/non-request code. Never `console.*` (only exception: fail-fast in [src/config/env.ts](../../../src/config/env.ts) which runs before logger init).
