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

**Domains:** `employee` (staff/admin, internal), `customer` (storefront shoppers), `auth` (refresh token + role/account-type primitives), `order`, `product-review` (AI classification + replies), `product` (+ `product-variant` for SKU/price/stock), `product-category` (hierarchical, via `parentId`), `product-property` (EAV property definitions), `chat`

**Fastify plugin wiring** (src/presentation/plugins/):

- `dbPlugin` → decorates `app.db`
- `authPlugin` → decorates `app.authenticate` and `app.requireRole`
- `servicesPlugin` (depends on db) → instantiates all repos, adapters, use cases; decorates `app.useCases` and `app.tokenSigner`

**Identity is two separate tables, not one** — `employees` (`companyEmail`, `department`, `role`: `staff`|`admin`) and `customers` (`email`, `phone`, `address`, `loyaltyPoints`) are independent tables with independent unique-email constraints; there is no shared `users` table. A single JWT/cookie mechanism authenticates both: the access token always carries `{ sub, email, role }` where `role` is `'admin' | 'staff' | 'customer'` (`AuthRole` in [src/domain/auth/auth-role.ts](src/domain/auth/auth-role.ts)), so every downstream check (`requireRole`, route guards) is role-based and doesn't care which table the identity came from. `auth_tokens` (refresh tokens) has no foreign key to either table — it carries a plain `user_id` plus an `account_type` (`'employee' | 'customer'`) column instead, since one FK column can't reference two different tables; refresh/logout look up the token row first to learn which table to query.

**Login is two separate endpoints, one per table** — `POST /api/v1/auth/employee-login` only ever queries `employees`; `POST /api/v1/auth/customer-login` only ever queries `customers`. Neither falls back to the other table. This means the caller declares intent by which endpoint it hits (admin login form → employee-login, storefront login form → customer-login), and a wrong-table credential simply gets `401 Invalid email or password` — there is no path where an employee-login call can return a customer account or vice versa. `EmployeeLoginUseCase`/`CustomerLoginUseCase` share password/lockout logic via [src/application/auth/login-helpers.ts](src/application/auth/login-helpers.ts) (`verifyPassword`, `issueTokens`) rather than duplicating it. There is no `/api/v1/auth/register` — a customer account is created via `POST /api/v1/customers` (see below); an employee account is created by an existing admin/staff via `POST /api/v1/employees` (`CreateEmployeeUseCase`), never self-registered.

**Staff is not full admin, but only for employees** — `staff` gets the same `/mist-ops`-equivalent route access as `admin` everywhere, including full CRUD on `/api/v1/customers/*`. The one carve-out is scoped to `employees`, enforced inside the use cases (not the route guard): `UpdateEmployeeUseCase`/`CreateEmployeeUseCase` reject `role: 'admin'` from a `staff` actor (`ForbiddenError`), and `DeleteEmployeeUseCase` rejects deleting a target whose `role === 'admin'` when the actor is `staff`. Both checks take the acting user's role as an explicit parameter passed down from `req.user.role` in the controller — there's no ambient "current user" lookup inside the use case. `customers` has no `role` concept at all, so this carve-out has nothing to apply to there.

**`POST /api/v1/customers` is the one and only way a customer account is created, and it's public** — a customer self-registering from the storefront and an admin/staff creating an account on a customer's behalf from mist-ops hit the exact same endpoint, because the payload shape (`firstName`/`lastName`/`email`/`phone`/`address`/`password`) is identical either way; there is no separate admin-only creation route. The route carries no `onRequest` auth hook (rate-limited instead, same config as login) so it works for an anonymous storefront visitor, but `csrfProtection` still enforces the CSRF token when the caller happens to already be an authenticated admin/staff session (it only skips CSRF when there's no `access_token` cookie at all — see the CSRF section below). All the other `/api/v1/customers/*` routes (`GET /`, `PATCH /:id`, `PATCH /:id/password`, `DELETE /:id`) are `requireRole(['admin', 'staff'])`.

**Customers self-serve through `/api/v1/customers/me`, not a separate route file** — `GET`/`PATCH /api/v1/customers/me` is `requireRole('customer')`, applied per-route (not a whole-file hook) in [src/presentation/routes/customer.routes.ts](src/presentation/routes/customer.routes.ts), so a customer can view/edit their own `firstName`/`lastName`/`phone`/`address` while `POST /` stays public and the `/:id` admin routes stay admin/staff-gated in the same file. `UpdateOwnCustomerBody` deliberately excludes `status`/`loyaltyPoints`, which only admin/staff can touch via `PATCH /:id`. There used to be a dedicated `/api/v1/account` route file for this — it was removed because it was solving a problem (a whole-file admin-only hook) that a per-route `onRequest` array already solves without a second file.

**Access (`AUTH_ACCESS_TOKEN_TTL`, 15m) and refresh (`AUTH_REFRESH_TOKEN_TTL`, 30d) tokens** are JWTs (HS256, `AUTH_JWT_SECRET`). `setAuthCookies` ([src/presentation/middlewares/auth-cookies.ts](src/presentation/middlewares/auth-cookies.ts)) sets both as httpOnly cookies (`access_token` path `/`, `refresh_token` path `/api/v1/auth`) plus a non-httpOnly `csrf_token`, and returns the generated CSRF token so the controller can also put it in the JSON response as `csrfToken`. The response body only includes `accessToken`/`refreshToken` when `env.NODE_ENV !== 'production'` (Swagger/Postman testing) — production responses carry `user`/`csrfToken` only, tokens live solely in httpOnly cookies. `GET /me` also returns `{ user, csrfToken }` (`csrfToken` omitted, not an error, for callers with no `csrf_token` cookie) — this lets FE recover a `csrfToken` after a reload where the access-token cookie was still valid and no refresh call happened; `GetCurrentUserUseCase` takes both `id` and `role` from the JWT claims to know which table to query. `authenticate` ([src/presentation/middlewares/auth.ts](src/presentation/middlewares/auth.ts)) reads the `access_token` cookie only — no `Authorization: Bearer` header support, so Swagger/Postman testing of protected routes needs the cookie set manually (e.g. via a prior login request in the same client). `refresh`/`logout` read `refresh_token` from the cookie only — no body fallback, no route-level body schema. Refresh tokens rotate on every use — `RefreshTokenUseCase` revokes the old jti and issues a new one, so a stolen refresh token is single-use. `requireRole(role)` accepts a single role or an array and runs after `authenticate`, checking `req.user.role` against the allowed set.

**CSRF** — `csrfProtection` ([src/presentation/middlewares/csrf.ts](src/presentation/middlewares/csrf.ts)) is a global `onRequest` hook (registered in `app.ts`, ahead of route registration). It skips GET/HEAD/OPTIONS, the exact routes in `CSRF_EXEMPT_ROUTES` (`POST /api/v1/auth/{employee-login,customer-login,refresh,logout}` — session-lifecycle endpoints: login can't be forged without the victim's password, refresh/logout are cookie-only and CORS blocks a cross-site attacker from ever reading the response), and any request with no `access_token` cookie (unauthenticated callers). `POST /api/v1/customers` isn't in `CSRF_EXEMPT_ROUTES` and doesn't need to be — an anonymous self-registering visitor has no `access_token` cookie, so the "no cookie" skip already covers that case, while an admin/staff session calling the same endpoint from mist-ops still has to pass CSRF like any other authenticated mutation. Everything else must echo the `csrf_token` cookie's value as an `X-CSRF-Token` header (double-submit, `timingSafeEqual` compare) or get a 403. Because FE and BE are on different origins, FE JS can never read `csrf_token` via `document.cookie` (cookies are only readable by pages on the exact domain that set them — unrelated to `SameSite`/`Secure`), which is why the token is also delivered in the login/refresh/me JSON bodies: FE reads it there and stores it (in `localStorage`, so it survives reload and stays in sync if another tab rotates it). `CSRF_EXEMPT_ROUTES` is an explicit method+path allowlist, not a path-prefix check — adding a new mutating route under `/api/v1/auth/` must not be silently CSRF-exempt, it has to be added to the set explicitly, or it stays protected by default.

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

**Password update** — employees: `PATCH /api/v1/employees/:id/password` (admin/staff-only). Customers: `PATCH /api/v1/customers/:id/password` (admin/staff, on behalf of a customer) — there's no self-service password-change endpoint (`PATCH /api/v1/customers/me` has no password field; a customer who forgets their password needs admin/staff to reset it, same as the reasoning above). Both hash via `PasswordHasher` before storing.

**Placing an order requires a customer login** — `POST /api/v1/orders` is `requireRole('customer')`; there is no guest checkout. `customerEmail` on the created order comes from `req.user.email` (the authenticated session), never from the request body — `CreateOrderBody` doesn't even have a `customerEmail` field, so a client can't spoof whose order it is. `GET /api/v1/orders/lookup?code=` (order tracking by full order-ID) stays public/unauthenticated on purpose — a customer with only the order-confirmation email link, not a logged-in session, still needs to check status.

**A product review requires a customer login, not an order code** — `POST /api/v1/product-reviews` and `POST /api/v1/product-reviews/:reviewId/replies` are both `requireRole('customer')`. `customerId`/`customerEmail` on the review, and `customerId` on a customer-authored reply, all come from `req.user`, never from the request body. `productId` is **required** and validated against `ProductRepo` (404 if the product doesn't exist) — a review is fundamentally about one product, not an order line item. There used to be a requirement to type in a real `orderId` as an anti-spam/anti-bot proof; that's gone now that the endpoint requires a real logged-in customer account instead, which is a stronger guarantee (an account survives across many reviews; an order ID was single-use and easy to guess-brute-force as a UUID lookup). `product_reviews.product_id` cascades on product delete (a review can't outlive the product it's about); `customer_id` is `set null` on customer delete (the review text stays as history, same reasoning as `orders.customer_email` staying a plain snapshot column rather than a hard FK).

**A review is classified once, then possibly reclassified when the customer follows up** — `POST /product-reviews` calls `ReviewClassificationPort.classify()` synchronously in the same request (one Gemini call, no retry loop — this app has no queue infra). The result routes the review:
```
Gemini call fails                          → status = pending_review (never auto-acted on; a human decides)
confidence = 'low' OR severity = 'high'    → status = pending_review
otherwise                                  → status = auto_responded, and the AI's suggested_response
                                              is posted as an actual reply (authorType: 'ai') — not just stored
```
When a **customer** (not admin/AI) posts a new reply on their own review (`POST /:reviewId/replies`), that reply text is fed back into `classification.classify()` as `followUpMessage` and the review is reclassified from scratch — so a follow-up like "tôi cần đổi sản phẩm" can bump `confidence` to `low` and pull the review back into `pending_review` for a human, instead of the thread just silently accumulating replies nobody reviews. Admin/staff replies never trigger reclassification. Staff and admin can move a review to any status by hand via `PATCH /:id/status` regardless of what the AI decided.

**Public visibility of a review is a status+category gate, not an admin toggle** — `GET /api/v1/product-reviews/product/:productId` (no auth) only returns rows where `category != 'spam' AND status IN ('auto_responded', 'resolved')`. Complaints and suggestions are shown publicly too, not just compliments — the storefront intentionally shows negative reviews once they've been through the classification/response pipeline, rather than only curating positive ones. A review sitting in `pending_review` (low AI confidence, high severity, or a customer follow-up that reopened it) is invisible on the storefront until an admin/staff moves it to `resolved` or the AI's own reclassification lands it on `auto_responded`.

**Order shipping fields** — `orders` only carries `shippingFullName` and `shippingAddress` (both nullable, both **required** in `CreateOrderBody`). There is no city/postal code — checkout collects a single free-text address, and name is one field, not split first/last. The migration that dropped `shippingFirstName`/`shippingLastName`/`shippingCity`/`shippingPostalCode` backfilled `shippingFullName` from the old first+last columns before dropping them.

**Product slug** — `products.slug` is unique and NOT NULL. `slugify()` in [src/domain/product/slugify.ts](src/domain/product/slugify.ts) is pure (NFD fold, `đ`→`d`, non-alphanumeric→`-`); uniqueness is resolved in `CreateProductUseCase`, which probes `findBySlug` and appends `-2`, `-3`, …. Renaming a product does **not** regenerate its slug — existing URLs must keep working. Changing one is an explicit `PATCH { slug }`, validated with `isSlug()` (400) and checked for collisions (409). `GET /api/v1/products/slug/:slug` is public and attaches variants.

**Product embedding text is assembled, not just name+description** — `buildProductEmbeddingText()` in [src/application/product/build-product-embedding-text.ts](src/application/product/build-product-embedding-text.ts) combines `name` + category names (including ancestor categories) + every variant's property values (deduped) + `description` into one document before embedding. `ProductRepo.getEmbeddingSource()` does the SQL joins (infrastructure); the text assembly itself stays a pure function (application). `syncProductEmbedding(productId, ...)` is called after create/update product, after `SetProductCategoriesUseCase`, and after `SetVariantPropertyValuesUseCase` — any mutation that changes what should be searchable re-embeds. It's synchronous/awaited inline and swallows its own errors (logs a warning, never throws) — same as before, no queue/job infra exists in this repo.

**Chat is RAG, not context dumping** — `SendChatMessageUseCase` embeds the customer's latest message with `MultimodalEmbeddingPort.embedQuery` (voice search uses `embedAudioQuery`; product indexing uses `embedDocument` — task type must match Gemini's asymmetric retrieval convention), retrieves the top 8 products via `findSimilarByVector` (the same pgvector index voice search uses), and injects only those into the system prompt. A `ProductFilterExtractionPort` (Gemini structured output) extracts an explicit price range from the question and applies it as a SQL `WHERE` alongside the vector search — vector similarity alone cannot express numeric thresholds. Price filtering matches "product has at least one variant in range" (an `EXISTS` subquery against `product_variants`), not the product's minimum price. Fallback chain: vector → `ilike` keyword → most recent products, all price-filtered, so the assistant never answers with an empty catalogue. Before building the prompt, retrieved products are enriched with variant price + property values (`buildCatalogueProducts`) so the model still sees price/origin/roast even though `Product` itself no longer carries them. If the final `chat.reply` call itself fails (quota, timeout, network), `SendChatMessageUseCase` catches it and returns a fixed Vietnamese apology string instead of throwing — retrieval already succeeded independently, so the client still gets `200` with real products, never a 502 from a downstream Gemini outage. Gemini is reached through `ChatPort` / `GeminiChatAdapter` — never call the SDK from a controller. System prompts live as versioned JSON in `src/prompts/` (`{promptName, version, template, variables}`), imported with `with { type: 'json' }` — do not inline prompt text back into adapter files.

**List `q` search** — `products` matches `name`, `description`, and (via an `EXISTS` subquery) any variant's property value — so searching an origin or roast level still works even though those aren't columns on `products` anymore; `employees` matches `first_name`, `last_name`, `company_email`, `role`; `customers` matches `first_name`, `last_name`, `email`, `phone`; `orders` matches `email` (partial), `id` (prefix, for the 8-char receipt code) and `status`. All use `ilike`, so they are case-insensitive, and every `q` is applied to both `list()` and `count()` so pagination totals stay consistent.

## CORS

Configured in [src/app.ts](src/app.ts) with explicit `methods` and `allowedHeaders`:

```ts
await app.register(cors, {
  origin: corsOrigin,           // from CORS_ORIGINS env var, comma-separated
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
});
```

`CORS_ORIGINS` must include the frontend origin (`https://todaywegrind.com` in production). Without explicit `allowedHeaders`, preflight fails for any request carrying `Authorization` or `X-CSRF-Token`.

**Domain topology** — frontend and backend are both subdomains of `todaywegrind.com` (backend at `api.todaywegrind.com`) — same-site, though still cross-origin. `COOKIE_SAME_SITE=lax` works for this (Lax only blocks cross-*site* requests, not cross-origin-same-site ones), so production no longer needs `SameSite=None`. Cookies deliberately have **no explicit `Domain` attribute** — they stay host-only to `api.todaywegrind.com`, not shared with `todaywegrind.com` itself. That's intentional, not an oversight: nothing on the frontend needs to read these cookies via `document.cookie` (see the CSRF note above — `csrfToken` is delivered through response bodies instead), so widening the cookie's scope to the whole site would only grow the attack surface for no benefit.

## Code style

- Files stay small — split when a file exceeds ~150 lines
- Names are self-explanatory — no comments of any kind
- One responsibility per file — if you need "and" to describe it, split it

## Skills

- Use `add-feature` skill when adding any new feature end-to-end
- Use `self-review` skill after every task before reporting done
