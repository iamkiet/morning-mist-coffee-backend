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

**Domains:** `user`, `auth` (refresh token), `product`, `product-type`, `order`, `chat`

**Fastify plugin wiring** (src/presentation/plugins/):

- `dbPlugin` → decorates `app.db`
- `authPlugin` → decorates `app.authenticate` and `app.requireRole`
- `servicesPlugin` (depends on db) → instantiates all repos, adapters, use cases; decorates `app.useCases` and `app.tokenSigner`

**Auth flow:** JWT access tokens (HS256) + JTI-based refresh tokens stored in DB. Access token accepted via Bearer header or cookie. Routes protected with `app.authenticate` or `app.requireRole()`.

## Conventions

- **ESM**: relative imports end in `.ts` (NodeNext + `rewriteRelativeImportExtensions`) — `tsc` rewrites them to `.js` in `dist/` at build time.
- **Strict TS**: `noUncheckedIndexedAccess` is on — array/index access returns `T | undefined`; guard before use.
- **Errors**: throw `AppError` subclasses from [src/lib/errors.ts](src/lib/errors.ts) (`NotFoundError`, `ConflictError`, `ValidationError`, `ForbiddenError`, `UnauthorizedError`, `ExternalServiceError`). Never plain `Error` for client-facing errors.
- **Env**: import the validated `env` from [src/config/env.ts](src/config/env.ts). Never read `process.env` directly. No defaults, no `?? fallback`, no `if (NODE_ENV === 'production')` — use explicit toggle env vars.
- **Domain purity**: `domain/` must be deterministic — no `Date.now()`, `new Date()` (no args), `Math.random()`, `crypto.randomUUID()`. Pass time/ids in from caller.
- **DB casing**: schema uses snake_case columns; Drizzle maps to camelCase automatically (`casing: 'snake_case'`).

## Key domain rules

**Order status transitions** — enforced in `canTransition()` in [src/domain/order/order.entity.ts](src/domain/order/order.entity.ts):
```
pending → paid | cancelled
paid    → shipped | cancelled
shipped → delivered
```
Skipping steps (e.g. `pending → shipped`) throws `ConflictError`.

**Product stock** — stored in a separate `product_stock` table (one row per product, upsert on write). `stockQuantity` is joined into `Product` at read time. `UpdateProductInput.stockQuantity` calls `ProductStockRepo.set()` which does an upsert to the exact value — not a delta. `UpdateProductUseCase` takes three constructor args: `(ProductRepo, ProductTypeRepo, ProductStockRepo)`.

**Password update** — `PATCH /api/v1/users/:id/password` (admin-only). Use case hashes the new password via `PasswordHasher` before storing.

**Order shipping fields** — `shippingFirstName`/`shippingLastName`/`shippingAddress`/`shippingCity`/`shippingPostalCode` are **required** in `CreateOrderBody` (every order placed through checkout has them) but **nullable** in `Order`/`orders` — orders created before these columns existed have `null`. Never tighten these to NOT NULL in a migration without backfilling first.

**Product slug** — `products.slug` is unique and NOT NULL. `slugify()` in [src/domain/product/slugify.ts](src/domain/product/slugify.ts) is pure (NFD fold, `đ`→`d`, non-alphanumeric→`-`); uniqueness is resolved in `CreateProductUseCase`, which probes `findBySlug` and appends `-2`, `-3`, …. Renaming a product does **not** regenerate its slug — existing URLs must keep working. Changing one is an explicit `PATCH { slug }`, validated with `isSlug()` (400) and checked for collisions (409). `GET /api/v1/products/slug/:slug` is public and joins `product_stock`.

**Product description is three columns** — `origin` (text), `tasting_notes` (`text[]`), `description` (short blurb). They were split out of one newline-delimited string; do not put them back into one field.

**Chat is RAG, not context dumping** — `SendChatMessageUseCase` embeds the customer's latest message with `MultimodalEmbeddingPort.embedQuery` (voice search uses `embedAudioQuery`; product indexing uses `embedDocument` — task type must match Gemini's asymmetric retrieval convention), retrieves the top 8 products via `findSimilarByVector` (the same pgvector index voice search uses), and injects only those into the system prompt. A `ProductFilterExtractionPort` (Gemini structured output) extracts an explicit price range from the question and applies it as a SQL `WHERE` alongside the vector search — vector similarity alone cannot express numeric thresholds. Fallback chain: vector → `ilike` keyword → most recent products, all price-filtered, so the assistant never answers with an empty catalogue. Gemini is reached through `ChatPort` / `GeminiChatAdapter` — never call the SDK from a controller. System prompts live as versioned JSON in `src/prompts/` (`{promptName, version, template, variables}`), imported with `with { type: 'json' }` — do not inline prompt text back into adapter files.

**List `q` search** — `products` matches `name`, `origin`, `description` and `tasting_notes`; `users` matches `first_name`, `last_name`, `email`, `role`; `orders` matches `email` (partial), `id` (prefix, for the 8-char receipt code) and `status`. All use `ilike`, so they are case-insensitive, and every `q` is applied to both `list()` and `count()` so pagination totals stay consistent.

## CORS

Configured in [src/app.ts](src/app.ts) with explicit `methods` and `allowedHeaders`:

```ts
await app.register(cors, {
  origin: corsOrigin,           // from CORS_ORIGINS env var, comma-separated
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

`CORS_ORIGINS` must include the frontend origin (e.g. `https://todaywegrind.com`). Without explicit `allowedHeaders`, preflight fails for any request with an `Authorization` header.

## Code style

- Files stay small — split when a file exceeds ~150 lines
- Names are self-explanatory — no comments of any kind
- One responsibility per file — if you need "and" to describe it, split it

## Skills

- Use `add-feature` skill when adding any new feature end-to-end
- Use `self-review` skill after every task before reporting done
