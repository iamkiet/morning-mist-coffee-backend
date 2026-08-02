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

## Still open

- **Structured product description** — `products.description` is one string that the
  frontend parses by line count into origin / tasting notes / description. The split is
  lossy; the frontend works around it by round-tripping the raw string. Proper fix is
  separate `origin` and `tasting_notes` columns. Not blocking.
- `product.repository.ts` is 191 lines, over the ~150 guidance in CLAUDE.md. It was
  already 168 before this change; splitting it was left out of scope.
- `GetProductByIdUseCase` does not join `product_stock`, so `GET /products/:id` always
  reports `stockQuantity: 0`. Pre-existing; the new by-slug use case does join it. The
  frontend does not call the by-id endpoint.
