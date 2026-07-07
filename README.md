# Morning Mist Coffee — Backend

Backend API cho cửa hàng cà phê **Morning Mist Coffee**. Fastify 5 + TypeScript, clean architecture, PostgreSQL (Drizzle ORM), JWT auth, quản lý sản phẩm/đơn hàng, email xác nhận (Resend), AI chat tư vấn và lớp bảo mật AI (Gemini WAF).

Chi tiết từng endpoint: [API.md](./API.md)

## Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 22+, ESM, TypeScript 6 |
| HTTP | Fastify 5 + `fastify-type-provider-zod` |
| Validation | Zod (request/response + env) |
| Database | PostgreSQL via Drizzle ORM (`postgres-js`) |
| Auth | JWT HS256 (`jose`) + JTI refresh tokens in DB + HttpOnly cookies |
| Password | bcryptjs |
| Email | Resend |
| AI | Google Gemini (`gemini-2.5-flash`) — chat assistant + security WAF |
| Security | `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit` |

## Architecture

Clean architecture — inner layers không import outer layers (enforced bởi `npm run check:arch`).

```
domain/          entities, repo interfaces, ports — no framework, no I/O
application/     use cases — depend only on domain abstractions
infrastructure/  Drizzle repos, adapters (jose, bcrypt, resend) — implements ports
presentation/    Fastify routes, controllers, schemas, serializers, plugins, middlewares
```

**Domains:** `user`, `auth` (refresh token), `product`, `product-type`, `order`

**Request flow:**

```
routes → controllers → use cases → repos/adapters → DB / external services
```

**Fastify plugin wiring** (`src/presentation/plugins/`):

- `dbPlugin` → decorates `app.db`
- `authPlugin` → decorates `app.authenticate`, `app.requireRole`
- `servicesPlugin` → instantiates repos, adapters, use cases; decorates `app.useCases`, `app.tokenSigner`, `app.aiSecurity`

## Chức năng

### Auth

- **Register** — cần header `X-User-Registration-Key`; hash password; trả access + refresh token; set HttpOnly cookies
- **Login** — verify email/password; token pair + cookies
- **Refresh** — đổi refresh token (body hoặc cookie) lấy token pair mới; JTI lưu DB
- **Logout** — revoke refresh token; xóa cookies
- **Me** — lấy profile user hiện tại (Bearer header hoặc access cookie)

Access token chấp nhận qua `Authorization: Bearer <token>` hoặc HttpOnly cookie. Role: `user` | `admin`.

### Users (admin only)

- List / filter / paginate users
- Update profile (role, status)
- Reset password (`PATCH /api/v1/users/:id/password`)

### Product Types

- List / create product types — cần đăng nhập (bất kỳ role nào, không giới hạn admin)

### Products

- **Public:** list (search, filter, sort, paginate, kèm `stockQuantity`), get by id
- **Admin:** create, update, delete
- **Stock (admin):** tồn kho lưu bảng `product_stock` riêng — get / increase / decrease

Giá lưu bằng **cents**, currency hiện chỉ hỗ trợ **VND**.

### Orders

- **Public:** `POST /api/v1/orders` — khách đặt hàng bằng email (không dùng `customerId`)
- **Public:** `GET /api/v1/orders/lookup?email=` — tra cứu đơn theo email
- **Admin:** list, get by id, cập nhật status

**Create order flow:**

1. Validate từng item — `productId` bắt buộc, product phải tồn tại, currency khớp
2. Server **ghi đè** `name` / `priceCents` từ DB (chống sửa giá client-side)
3. Giảm stock batch — fail nếu hết hàng
4. Tính lại `totalCents`; tùy chọn `cashReceivedCents` → tính `changeCents`
5. Lưu order + items; gửi email xác nhận qua Resend (best-effort, không block nếu email fail)

**Order status state machine** (bỏ bước sẽ bị `409 CONFLICT`):

```
pending  → paid | cancelled
paid     → shipped | cancelled
shipped  → delivered
delivered → (terminal)
cancelled → (terminal)
```

### AI Chat Assistant

`POST /api/v1/chat` — public, không cần auth.

- Model: `gemini-2.5-flash`
- Persona: trợ lý Morning Mist Coffee, trả lời tiếng Việt, phong cách nhã nhặn tối giản
- **Context injection:** nạp ~30 sản phẩm mới nhất (tên, giá VND, mô tả rút gọn) vào system prompt
- Duy trì lịch sử hội thoại (chuẩn hóa luân phiên user/model)
- Trả về `{ "message": "..." }`
- Cần `GEMINI_API_KEY`; thiếu key → `503 AI_NOT_CONFIGURED`

### AI Security WAF

Chạy trên `POST /api/v1/auth/register` và `POST /api/v1/auth/login` (preHandler).

- Phân tích payload bằng Gemini — phát hiện SQLi, XSS, path traversal, bot/spam signup
- **DANGEROUS** → block request (`403 FORBIDDEN`)
- **SUSPICIOUS** → log cảnh báo, vẫn cho qua
- **SAFE** → cache payload (tối đa 1000 entries) để giảm gọi API
- Không có `GEMINI_API_KEY` → bỏ qua kiểm tra

### Health

- `GET /health` — uptime + DB check (`200` ok / `503` degraded)
- `GET /ready` — readiness probe

## Setup

```bash
cp .env.example .env
docker compose up -d pg-db
npm install
npm run db:push          # dev: push schema trực tiếp
npm run db:seed          # optional: seed product types + products
npm run dev              # http://localhost:3000
```

Production: dùng `npm run db:generate` + `npm run db:migrate` thay vì `db:push`.

## Environment variables

App không boot nếu thiếu hoặc sai env. Xem `.env.example` đầy đủ.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_JWT_SECRET` | HMAC key cho JWT (min 32 chars) |
| `AUTH_ACCESS_TOKEN_TTL` | e.g. `15m` |
| `AUTH_REFRESH_TOKEN_TTL` | e.g. `30d` |
| `USER_REGISTRATION_KEY` | Gate cho register (header `X-User-Registration-Key`, min 32 chars) |
| `CORS_ORIGINS` | Comma-separated origins (phải có frontend origin) |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` | Cookie settings (`none` + secure=true cho cross-domain prod) |
| `RESEND_API_KEY` / `RESEND_FROM` | Email order confirmation |
| `GEMINI_API_KEY` | AI chat + security WAF (optional — tắt AI nếu thiếu) |
| `AUTH_LOGIN_RATE_MAX` / `AUTH_LOGIN_RATE_WINDOW` | Rate limit cho login/register/refresh |
| `EXPOSE_INTERNAL_ERRORS` | `true` dev/staging, `false` prod |

**Generate secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"  # AUTH_JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"  # USER_REGISTRATION_KEY
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | tsx watch mode |
| `npm run build` | TypeScript → `dist/` |
| `npm start` | run `dist/server.js` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run check:dead` | knip — dead code detection |
| `npm run check:arch` | validate clean architecture boundaries |
| `npm run db:generate` | generate SQL migrations |
| `npm run db:migrate` | apply migrations |
| `npm run db:push` | push schema directly (dev) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | seed sample products |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |

## Endpoints overview

| Method | Path | Auth |
|--------|------|------|
| GET | `/health`, `/ready` | — |
| POST | `/api/v1/auth/register` | registration key + AI WAF |
| POST | `/api/v1/auth/login` | AI WAF |
| POST | `/api/v1/auth/refresh`, `/logout` | refresh token |
| GET | `/api/v1/auth/me` | user |
| GET/PATCH | `/api/v1/users/*` | admin |
| GET/POST | `/api/v1/product-types/*` | user |
| GET | `/api/v1/products`, `/api/v1/products/:id` | — |
| POST/PATCH/DELETE | `/api/v1/products/*` | admin |
| GET/POST | `/api/v1/products/:id/stock/*` | admin |
| POST | `/api/v1/orders` | — |
| GET | `/api/v1/orders/lookup` | — |
| GET | `/api/v1/orders`, `/api/v1/orders/:id` | admin |
| PATCH | `/api/v1/orders/:id/status` | admin |
| POST | `/api/v1/chat` | — (cần `GEMINI_API_KEY`) |

## Example: create order

```json
{
  "email": "customer@example.com",
  "currency": "VND",
  "totalCents": 100000,
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "placeholder",
      "priceCents": 50000,
      "quantity": 2
    }
  ]
}
```

`name`, `priceCents`, `totalCents` trong request chỉ để pass validation — server tính lại từ DB.

## Error responses

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

| Status | Code | Cause |
|--------|------|-------|
| `400` | `VALIDATION_ERROR` | Invalid body/query |
| `401` | `UNAUTHORIZED` | Missing/invalid token, sai role |
| `403` | `FORBIDDEN` | Registration key sai, AI WAF block |
| `404` | `NOT_FOUND` | Resource not found |
| `409` | `CONFLICT` | Duplicate / invalid state transition / out of stock |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests |
| `502` | `EXTERNAL_SERVICE_ERROR` | External service failure (email, etc.) |
| `500` | `INTERNAL_ERROR` | Unexpected error |
| `503` | `AI_NOT_CONFIGURED` | Chat called without Gemini key |

Global rate limit: **100 requests/minute** (mọi route). Login/register/refresh có rate limit riêng qua `AUTH_LOGIN_RATE_*`.

## Conventions

- ESM imports end in `.js` (NodeNext), source is `.ts`
- Throw `AppError` subclasses from `src/lib/errors.ts` — never plain `Error` for client-facing errors
- Import validated `env` from `src/config/env.ts` — never read `process.env` directly
- `domain/` must be deterministic — no `Date.now()`, `Math.random()`, `crypto.randomUUID()`; pass time/ids from caller
