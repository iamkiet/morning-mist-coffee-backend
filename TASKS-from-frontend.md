# Frontend-requested backend work — status

Implemented 2026-08-02. Verified against a local Postgres (`docker compose up -d pg-db`)
with the real seed data; `typecheck`, `lint`, `check:arch`, `check:dead` all pass.

## Done

- **`products.slug`** — unique NOT NULL column, pure `slugify()` in `domain/product/`,
  collision dedupe in `CreateProductUseCase`, `findBySlug` on the repo,
  `GET /api/v1/products/slug/:slug` (public, joins stock), `slug` in `ProductSchema`,
  optional `slug` in `UpdateProductBody` (400 if malformed, 409 if taken).
  Renaming a product keeps its slug.
- **`GET /api/v1/orders?q=`** — partial email, order-id prefix (the 8-char receipt code),
  and status. Applied to `list()` and `count()`.
- **Product `q` widened** to match `description` as well as `name`.
- **User `q` widened** to match `role` as well as name/email, preserving what the admin
  table's old client-side filter could do.

## ⚠️ NOT applied to the hosted database

`drizzle/20260802041524_perfect_warstar/migration.sql` has **not** been run against the
Render database in `.env`. It was only applied to local docker Postgres.

The generated migration was rewritten by hand: `drizzle-kit` emitted
`ADD COLUMN "slug" text NOT NULL` with no default, which **fails on any non-empty table**.
The committed version adds the column nullable, backfills it (Vietnamese diacritics
folded, duplicates suffixed `-2`, `-3`, blank names → `san-pham`), then applies NOT NULL
and the unique index.

To apply:

```bash
npm run db:migrate      # uses DATABASE_URL from .env — the Render database
```

Back up first. The backfill is a single `UPDATE`; the whole file runs in one transaction,
so a duplicate-slug collision aborts it cleanly rather than leaving a half-migrated table.

**The frontend depends on this.** Until it runs, `GET /products/slug/:slug` 404s against
the hosted API and every product detail page is broken.

`drizzle/20260802155524_lame_payback/migration.sql` (adds `shipping_first_name`,
`shipping_last_name`, `shipping_address`, `shipping_city`, `shipping_postal_code` to
`orders`, all nullable — safe on a non-empty table, no rewrite needed) is **also** not
applied to the hosted database yet. Until it runs, `POST /api/v1/orders` against the
hosted API will hard-fail with a Postgres "column does not exist" error, because the
insert now always writes to these five columns — **checkout on the hosted deployment
is broken until this migration runs.**

## Resolved since this doc was written

- **Structured product description** — `origin` and `tasting_notes` are now real
  columns (`text` / `text[]`) on `products`, split out of the old one-string blob.
  `description` stays a short blurb. See migration `20260802044739_lucky_barracuda`.
- `product.repository.ts` is back under the ~150-line guidance (151 lines) after
  extracting `ilike-pattern.ts` and `product.mappers.ts`.
- `GetProductByIdUseCase` now joins `product_stock` via `attachStockOne()`, same as the
  by-slug use case — `GET /products/:id` no longer hardcodes `stockQuantity: 0`.

## Still open

- None known from this list. Check `git log` for anything newer than this file's date.
