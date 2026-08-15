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

**Domains:** `user`, `auth` (refresh token), `product` (+ `product-variant` for SKU/price/stock), `product-category` (hierarchical, via `parentId`), `product-property` (EAV property definitions), `order`, `chat`

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

**Products are variant-based** — `products` holds only identity/copy (`slug`, `name`, `description`, `image`, `embedding`). Price, SKU, and stock live on `product_variants` (one product → many variants, e.g. different weights). `CreateProductUseCase` requires an initial `variant` in the same request — a product with zero variants is unsellable. Stock changes go through `ProductVariantRepo` keyed by `variantId` (`increaseStock`/`setStock`/`tryDecreaseStock`/`tryDecreaseStockBatch`), never a per-product scalar.

**Product attributes are EAV, not fixed columns** — `product_properties` defines named attributes (`Xuất xứ`, `Mức rang`, `Phương pháp chế biến`, `Trọng lượng`, ...) with a `dataType` (`text`/`number`/`enum`). `product_variant_property_values` attaches a value to one variant + one property (unique per pair). Values are set via `SetVariantPropertyValuesUseCase` (replace-all semantics per variant, also settable inline via `CreateProductUseCase`'s `variant.propertyValues` and `CreateProductVariantUseCase`'s `propertyValues`), not individual product columns. `attachVariants`/`attachVariantsOne` in [src/application/product/attach-variants.ts](src/application/product/attach-variants.ts) batch-fetch each variant's property values via `ProductVariantRepo.getPropertyValuesByVariantIds` and attach them as `ProductVariantWithProperties.propertyValues`, so every product-read path (list/getById/getBySlug/voice search) returns real values on `ProductVariantDTO.propertyValues` — the admin variant-mutation endpoints (create/update variant, stock adjust) return a bare `ProductVariant` and omit this field.

**Product categories are hierarchical** — `product_categories.parentId` self-references for a tree (e.g. `Đồ uống` → `Cà phê` → `Arabica`). `products_categories` is the M:N join. `ProductCategoryRepo.list()` returns the flat array; callers build the tree client-side. `SetProductCategoriesUseCase` is replace-all per product.

**Password update** — `PATCH /api/v1/users/:id/password` (admin-only). Use case hashes the new password via `PasswordHasher` before storing.

**Order shipping fields** — `shippingFirstName`/`shippingLastName`/`shippingAddress`/`shippingCity`/`shippingPostalCode` are **required** in `CreateOrderBody` (every order placed through checkout has them) but **nullable** in `Order`/`orders` — orders created before these columns existed have `null`. Never tighten these to NOT NULL in a migration without backfilling first.

**Product slug** — `products.slug` is unique and NOT NULL. `slugify()` in [src/domain/product/slugify.ts](src/domain/product/slugify.ts) is pure (NFD fold, `đ`→`d`, non-alphanumeric→`-`); uniqueness is resolved in `CreateProductUseCase`, which probes `findBySlug` and appends `-2`, `-3`, …. Renaming a product does **not** regenerate its slug — existing URLs must keep working. Changing one is an explicit `PATCH { slug }`, validated with `isSlug()` (400) and checked for collisions (409). `GET /api/v1/products/slug/:slug` is public and attaches variants.

**Product embedding text is assembled, not just name+description** — `buildProductEmbeddingText()` in [src/application/product/build-product-embedding-text.ts](src/application/product/build-product-embedding-text.ts) combines `name` + category names (including ancestor categories) + every variant's property values (deduped) + `description` into one document before embedding. `ProductRepo.getEmbeddingSource()` does the SQL joins (infrastructure); the text assembly itself stays a pure function (application). `syncProductEmbedding(productId, ...)` is called after create/update product, after `SetProductCategoriesUseCase`, and after `SetVariantPropertyValuesUseCase` — any mutation that changes what should be searchable re-embeds. It's synchronous/awaited inline and swallows its own errors (logs a warning, never throws) — same as before, no queue/job infra exists in this repo.

**Chat is RAG, not context dumping** — `SendChatMessageUseCase` embeds the customer's latest message with `MultimodalEmbeddingPort.embedQuery` (voice search uses `embedAudioQuery`; product indexing uses `embedDocument` — task type must match Gemini's asymmetric retrieval convention), retrieves the top 8 products via `findSimilarByVector` (the same pgvector index voice search uses), and injects only those into the system prompt. A `ProductFilterExtractionPort` (Gemini structured output) extracts an explicit price range from the question and applies it as a SQL `WHERE` alongside the vector search — vector similarity alone cannot express numeric thresholds. Price filtering matches "product has at least one variant in range" (an `EXISTS` subquery against `product_variants`), not the product's minimum price. Fallback chain: vector → `ilike` keyword → most recent products, all price-filtered, so the assistant never answers with an empty catalogue. Before building the prompt, retrieved products are enriched with variant price + property values (`buildCatalogueProducts`) so the model still sees price/origin/roast even though `Product` itself no longer carries them. If the final `chat.reply` call itself fails (quota, timeout, network), `SendChatMessageUseCase` catches it and returns a fixed Vietnamese apology string instead of throwing — retrieval already succeeded independently, so the client still gets `200` with real products, never a 502 from a downstream Gemini outage. Gemini is reached through `ChatPort` / `GeminiChatAdapter` — never call the SDK from a controller. System prompts live as versioned JSON in `src/prompts/` (`{promptName, version, template, variables}`), imported with `with { type: 'json' }` — do not inline prompt text back into adapter files.

**List `q` search** — `products` matches `name`, `description`, and (via an `EXISTS` subquery) any variant's property value — so searching an origin or roast level still works even though those aren't columns on `products` anymore; `users` matches `first_name`, `last_name`, `email`, `role`; `orders` matches `email` (partial), `id` (prefix, for the 8-char receipt code) and `status`. All use `ilike`, so they are case-insensitive, and every `q` is applied to both `list()` and `count()` so pagination totals stay consistent.

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
