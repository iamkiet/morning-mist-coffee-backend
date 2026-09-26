# Morning Mist Coffee — Backend

Backend API cho cửa hàng cà phê **Morning Mist Coffee**. Fastify 5 + TypeScript, clean architecture, PostgreSQL + pgvector (Drizzle ORM), JWT auth, quản lý sản phẩm (variant + EAV property)/đơn hàng/đánh giá, email xác nhận (Resend), AI chat tư vấn, voice semantic search và Security Agent tự động cảnh báo.

Chi tiết từng endpoint: Swagger UI tại `/documents` khi server chạy (tự sinh từ Zod schema, luôn khớp thực tế).

## Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 22+, ESM, TypeScript 6 |
| HTTP | Fastify 5 + `fastify-type-provider-zod` |
| Validation | Zod (request/response + env) |
| Database | PostgreSQL + pgvector via Drizzle ORM (`postgres-js`) |
| Auth | JWT HS256 (`jose`) + JTI refresh tokens in DB + HttpOnly cookies |
| Password | bcryptjs |
| Email | Resend |
| AI | Google Gemini (`@google/genai`) — chat assistant, voice search, review classification, security agent |
| Security | `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit`, CSRF double-submit |

## Architecture

Clean architecture — inner layers không import outer layers (enforced bởi `npm run check:arch`, chạy tự động như Stop hook).

```
domain/          entities, repo interfaces, ports — no framework, no I/O
application/     use cases — depend only on domain abstractions
infrastructure/  Drizzle repos, adapters (jose, bcrypt, resend, Gemini) — implements ports
presentation/    Fastify routes, controllers, schemas, serializers, plugins, middlewares
```

**Domains:** `employee`, `customer`, `auth` (refresh token), `order`, `product` (+ `product-variant`), `product-category`, `product-property` (EAV), `product-review`, `chat`, `security`

**Request flow:**

```
routes → controllers → use cases → repos/adapters → DB / external services
```

**Fastify plugin wiring** (`src/presentation/plugins/`):

- `dbPlugin` → decorates `app.db`
- `authPlugin` → decorates `app.authenticate`, `app.requireRole`
- `servicesPlugin` → instantiates repos, adapters, use cases; decorates `app.useCases`, `app.tokenSigner`

## Chức năng

### Auth

- **Login tách 2 endpoint riêng theo bảng**: `POST /api/v1/auth/employee-login` chỉ query `employees`, `POST /api/v1/auth/customer-login` chỉ query `customers` — không fallback chéo, không có endpoint `/register` chung
- **Refresh** — đổi refresh token (cookie only) lấy token pair mới; JTI rotate mỗi lần dùng (stolen token chỉ dùng được 1 lần)
- **Logout** — revoke refresh token; xóa cookies
- **Me** — `GET /api/v1/auth/me`, lấy profile user hiện tại từ `access_token` cookie (không hỗ trợ `Authorization: Bearer`)

Access token là HttpOnly cookie. Role: `admin` | `staff` | `customer`, lấy từ 1 trong 2 bảng riêng biệt `employees` (`admin`/`staff`) và `customers` — không có bảng `users` chung, 1 JWT duy nhất mang `{ sub, email, role }` để mọi route guard chỉ cần check role.

**CSRF** — double-submit cookie (`X-CSRF-Token` header phải khớp `csrf_token` cookie), global `onRequest` hook. Exempt: GET/HEAD/OPTIONS, các route session-lifecycle (login/refresh/logout), và request không có `access_token` cookie (khách chưa đăng nhập).

### Customers

- `POST /api/v1/customers` — public (rate-limited + registration-key header), tạo tài khoản customer (khách tự đăng ký hoặc admin/staff tạo hộ, cùng 1 endpoint)
- `GET/PATCH /api/v1/customers/me` — customer tự xem/sửa hồ sơ chính mình (không có `status`/`loyaltyPoints`)
- `GET/PATCH/DELETE /api/v1/customers/*`, `PATCH .../password` (admin/staff) — list, sửa `status`/`loyaltyPoints`, đổi mật khẩu hộ, xoá

### Employees (admin/staff only)

- List / create / update / xoá nhân viên (`PATCH /api/v1/employees/:id/password` để đổi mật khẩu)
- Staff không được set role `admin`, xoá tài khoản `admin`, hay tạo tài khoản `admin` mới (enforce trong use case, không phải route guard)

### Product Categories & Properties

- `product-categories` — cây phân cấp qua `parentId` (vd. Đồ uống → Cà phê → Arabica); CRUD admin/staff
- `product-properties` — định nghĩa thuộc tính EAV (Xuất xứ, Mức rang, ...) với `dataType`; CRUD admin/staff

### Products

- **Public:** list (search, filter, sort, paginate), get by id, get by slug (`GET /api/v1/products/slug/:slug`)
- **Admin/staff:** create, update, delete; gán categories (`PUT /:id/categories`); quản lý variant (`POST/PATCH/DELETE .../variants`), thuộc tính variant (`PUT .../variants/:id/properties`), stock (`GET/POST .../variants/:id/stock/*`)
- **Slug:** derive tự động từ `name` (`slugify()` — NFD fold, `đ`→`d`, non-alphanumeric→`-`), dedupe bằng suffix `-2`, `-3`, …; đổi tên sản phẩm **không** đổi slug — sửa slug là `PATCH { slug }` tường minh (400 nếu sai định dạng, 409 nếu trùng)
- **Variant-based:** `products` chỉ giữ identity/copy (slug, name, description, image, embedding). Giá (cents, VND), SKU, stock nằm trên `product_variants` — 1 sản phẩm → nhiều variant (vd. khác trọng lượng). Tạo sản phẩm bắt buộc kèm variant đầu tiên.
- **Thuộc tính variant (EAV):** `product_variant_property_values` gắn giá trị vào 1 variant + 1 property, set qua use case replace-all per variant

### Orders

- **`POST /api/v1/orders` yêu cầu đăng nhập customer** — không có guest checkout; `customerEmail` lấy từ session (`req.user.email`), không nhận từ body
- **`GET /api/v1/orders/lookup?code=`** — public, rate-limit riêng theo IP (5 req/phút), tra cứu bằng mã đơn (8 ký tự đầu order id) — dành cho khách có link xác nhận nhưng không đăng nhập
- **`GET /api/v1/orders/me`** — customer xem đơn của chính mình
- **Admin/staff:** list, get by id, cập nhật status

**Create order flow:** validate item → server ghi đè `name`/`priceCents` từ DB (chống sửa giá client-side) → giảm stock batch (fail nếu hết hàng) → tính lại `totalCents` → lưu order + gửi email xác nhận (Resend, best-effort)

**Order status state machine** (bỏ bước sẽ bị `409 CONFLICT`, xem `canTransition()` trong `src/domain/order/order.entity.ts`):

```
pending  → paid | cancelled
paid     → shipped | cancelled
shipped  → delivered
delivered → (terminal)
cancelled → (terminal)
```

Shipping info: `shippingFullName` + `shippingAddress` (cả hai nullable ở DB nhưng bắt buộc khi tạo order — 1 field tên, 1 field địa chỉ tự do, không tách city/postal code).

### Product Reviews

- `POST /api/v1/product-reviews` — customer, bắt buộc `productId` hợp lệ; trả response NGAY sau khi insert (`status: pending_classification`) — classify chạy fire-and-forget phía sau, không block response
- `POST /:reviewId/replies` — CHỈ admin/staff (không có endpoint reply cho customer — customer muốn nói thêm thì viết review mới hoặc hỏi Chat). Mỗi review tối đa 1 reply
- `PATCH /:id/status` — admin/staff force set status
- `GET /product/:productId` — public, mọi review hiển thị ngay từ lúc submit (không gate theo status) — chỉ loại trừ `category = 'spam'`

**Classification routing (chạy đúng 1 lần/review, không retry):**

```
Gemini call fails                          → status = pending_reply, category = 'unclassified', severity = 'high'
confidence = 'low' OR severity = 'high'    → status = pending_reply
otherwise                                  → status = auto_responded (AI tự đăng reply)
```

Admin/staff trả lời lúc đang `pending_reply` → tự động chuyển `resolved`, không cần `PATCH /:id/status` riêng.

### AI Chat Voice

`POST /api/v1/chat/voice` — public, rate-limit riêng (5 req/phút), multipart audio (webm/wav/mp3/ogg, tối đa 10MB và 60 giây — `CHAT_VOICE_MAX_DURATION_SECONDS` trong `SendChatMessageUseCase`).

- Audio convert sang WAV (ffmpeg) → (a) transcribe bằng Gemini ra transcript, (b) embed thẳng bằng `gemini-embedding-2` (`embedAudioQuery`, cùng không gian vector với embedding sản phẩm) để cosine similarity search
- Transcript dùng để: trích ràng buộc giá, làm keyword fallback (`ilike`) khi vector rỗng/lỗi, và làm input cho Gemini soạn câu trả lời
- Response: `{ message, items, transcript }`
- `halfvec(3072)` thay vì `vector` — pgvector giới hạn index HNSW/IVFFlat ở 2000 chiều cho kiểu `vector`, `gemini-embedding-2` trả 3072 chiều nên phải dùng `halfvec` (fp16, trần index 4000 chiều) để giữ đủ chiều mà vẫn index được
- Embedding sản phẩm nhúng từ `name` + category (kể cả ancestor) + property values của mọi variant + `description` (`buildProductEmbeddingText`), tự sinh lại sau mọi mutation ảnh hưởng đến nội dung tìm kiếm được (create/update product, set categories, set variant properties), best-effort (lỗi Gemini không fail request). Backfill sản phẩm cũ: `npm run db:backfill`.

### AI Chat Assistant

`POST /api/v1/chat/text` — public, rate-limit riêng (5 req/phút), cần `GEMINI_API_KEY` (thiếu → `503 AI_NOT_CONFIGURED`).

- Model Gemini, persona trợ lý Morning Mist Coffee, trả lời tiếng Việt
- **RAG bằng vector:** embed tin nhắn mới nhất (`embedQuery`), lấy top 8 sản phẩm gần nhất (`findSimilarByVector`, cùng index với voice search), enrich với giá/property values (`buildCatalogueProducts`) rồi mới tiêm vào system prompt
- `ChatFilterExtractionPort` (Gemini structured output) trích ràng buộc giá từ câu hỏi, áp `EXISTS` subquery lên `product_variants` (match "có variant trong khoảng giá", không phải giá min của sản phẩm)
- Fallback chain: vector lỗi/rỗng → `ilike` keyword → danh sách mới nhất, luôn giữ filter giá
- **Fail-soft ở bước soạn câu trả lời:** nếu `ChatPort.reply` lỗi (quota, timeout...) sau khi retrieval đã xong → trả `200` với apology string cố định thay vì lỗi cho client
- Request: `{ messages: [{ role: 'user'|'assistant', content }] }`, response: `{ message }`

### Prompt Injection (A05) — phòng thủ

Phòng thủ prompt injection ở bề mặt LLM: mọi tin nhắn khách (role `user`, kể cả lịch sử) bọc trong tag `<user_message>`, system instruction cấm thực thi chỉ thị nằm trong tag đó. A05/Injection thật sự (SQL) được chặn bằng Drizzle tham số hoá + Zod validate, không phụ thuộc AI.

### Bảo mật toàn ứng dụng — OWASP Top 10:2025 (web app): **10/10 hoàn thành**

> Danh sách A01-A10 này (nguồn: https://owasp.org/Top10/2025/) áp dụng cho **toàn bộ backend**, khác với danh sách ASI ở mục Security Agent bên dưới (chỉ đánh giá riêng 1 tính năng). Xem thêm `report.md` (root repo, ngoài thư mục này).

| Mã | Hạng mục | Nội dung | Trạng thái |
|----|----------|----------|:---:|
| A01 | Broken Access Control | Middleware `requireRole()` chặn route quản trị; ID không đoán được cho link tra cứu đơn hàng | ✅ |
| A02 | Security Misconfiguration | `@fastify/helmet` (CSP, HSTS...), `@fastify/cors` giới hạn origin, Cloudflare tự redirect HTTP→HTTPS | ✅ |
| A03 | Software Supply Chain | `npm audit fix`, version pin cứng trong `package.json`, GitHub Action `audit.yml` + Dependabot | ✅ |
| A04 | Cryptographic Failures | `jose` ký/verify JWT, `bcryptjs` băm mật khẩu, không lưu plaintext | ✅ |
| A05 | Injection | Drizzle ORM tham số hoá (tagged template) cho mọi SQL, không nối chuỗi thủ công | ✅ |
| A06 | Insecure Design | CSRF protection: cookie `csrf_token` + middleware `csrfProtection` (double-submit) — 1 ví dụ cụ thể, không phải toàn bộ phạm vi A06 | ✅ |
| A07 | Authentication Failures | Zod ép password phức tạp; `failed_login_attempts`/`locked_until` tự khoá 15 phút sau 5 lần sai — **chưa có MFA** | ✅ (chưa MFA) |
| A08 | Software/Data Integrity | `package-lock.json` + `npm ci` trong Dockerfile, build luôn đúng version đã audit | ✅ |
| A09 | Logging & Alerting | `pino` log có cấu trúc; Security Agent gửi email cảnh báo qua `resend` khi phát hiện bất thường | ✅ |
| A10 | Exceptional Conditions | `process.on('uncaughtException'/'unhandledRejection')` bắt lỗi/promise reject ngoài tầm kiểm soát | ✅ |

### Security Agent — OWASP Top 10 for Agentic Applications 2026: **7/10 covered**

> Danh sách ASI01-10 này (nguồn: OWASP GenAI Security Project, genai.owasp.org) chỉ đánh giá riêng tính năng **Security Agent** (agent tự ra quyết định block IP / gửi email) — không phải toàn app.

Agentic job (`SecurityAgentService`, chạy mỗi 60s) gom toàn bộ sự kiện bảo mật phát sinh từ chu kỳ trước theo IP, gọi Gemini 1 lần để nhận quyết định cho từng IP (login fail và rate-limit hit của mọi rate-limit trong app — `SecurityEventStore`, xử lý xong thì xoá, mỗi sự kiện chỉ xử lý 1 lần) và giao cho Gemini quyết định action: `IGNORE` | `LOG_ONLY` | `ALERT_EMAIL` | `TEMP_BLOCK_IP` (structured output).

| ASI | Hạng mục (tên chính thức) | Trạng thái | Cơ chế / lý do |
|-----|----------|:---:|--------|
| ASI01 | Agent Goal Hijack | ✅ Đã cover | `sanitizeSecurityEvent()` strip ký tự không in được + `` {}<>` ``, truncate 300 ký tự, bọc `<events>` tag + chỉ thị không theo lệnh giả bên trong (chặn prompt injection đổi mục tiêu agent) |
| ASI02 | Tool Misuse | ✅ Đã cover | `isSecurityAgentAction()` allow-list cố định (reject action lạ); rate-limit riêng cho action thật (`ALERT_EMAIL`/`TEMP_BLOCK_IP`, tối đa 5 lần/10 phút) |
| ASI03 | Identity & Privilege Abuse | ✅ Đã cover | Least privilege theo thiết kế: agent chỉ được inject event store, IP block list, Gemini và email sender — không truy cập DB, không có credential của user/admin; email chỉ gửi tới `SECURITY_AGENT_ALERT_EMAIL` cố định, AI không chọn được người nhận |
| ASI04 | Agentic Supply Chain Vulnerabilities | ❌ Chưa cover | Chỉ có `npm audit`/Dependabot ở mức app chung (A03 ở trên), chưa có kiểm soát riêng cho chuỗi cung ứng của agent (tool/plugin) |
| ASI05 | Unexpected Code Execution | ❌ Chưa cover | Agent không tự thực thi code nên rủi ro thấp, nhưng cũng chưa có sandbox/guard rail tường minh |
| ASI06 | Memory & Context Poisoning | ✅ Đã cover | Event store (cap 2000) + IP block list (cap 1000) đều có TTL/expiry và cap kích thước — dữ liệu cũ/độc tự hết hạn, không tồn tại vĩnh viễn trong context của agent |
| ASI07 | Insecure Inter-Agent Communication | N/A | Hệ thống chỉ có 1 agent duy nhất, không có giao tiếp liên-agent nên hạng mục này chưa áp dụng |
| ASI08 | Cascading Failures | ✅ Đã cover | Rate-limit action thật: tối đa 5 lần `ALERT_EMAIL`/`TEMP_BLOCK_IP` trong 10 phút (đếm toàn hệ thống), vượt → bỏ qua hành động của cycle đó |
| ASI09 | Human-Agent Trust Exploitation | ✅ Đã cover | Email cảnh báo gửi `reason` do Gemini sinh ra dưới dạng **plain text only**, không HTML, URL/domain bị defang (`https[://]evil[.]com`), kèm dòng cảnh báo nội dung do AI sinh — tránh nội dung AI đánh lừa người vận hành |
| ASI10 | Rogue Agents | ✅ Đã cover | `SECURITY_AGENT_ENABLED=false` tắt hành động tự động (kill switch/human override): job vẫn chạy mỗi 60s nhưng return ngay, không gọi Gemini, không email, không block (chỉ log mức `debug`); đổi cờ cần restart |

`TEMP_BLOCK_IP` chặn IP 5 phút qua `IpBlockList` (in-memory), kiểm tra ở `onRequest` hook toàn app (trừ `/health`) → `403 FORBIDDEN`.

### Health

- `GET /health` — uptime + DB check (`200` ok / `503` degraded)

## Setup

```bash
cp .env.example .env
docker compose up -d pg-db   # image pgvector/pgvector:pg18 — cần cho voice search
npm install
npm run db:migrate           # áp migration có sẵn (bao gồm extension pgvector + cột embedding)
npm run db:seed              # optional: seed product types + products
npm run db:backfill          # optional: sinh embedding cho sản phẩm đã seed (cần GEMINI_API_KEY)
npm run dev                  # http://localhost:3000
```

Production: dùng `npm run db:generate` + `npm run db:migrate` (không dùng `db:push`, để có file migration SQL làm bằng chứng thay đổi schema). Hoặc `npm run db:provision` (migrate + seed + backfill) trong 1 lệnh.

## Environment variables

Rate-limit và giới hạn độ dài audio KHÔNG cấu hình qua env: rate-limit ở `src/presentation/middlewares/rate-limits.ts` (toàn app 100/phút, login + refresh + tạo customer/employee 5/phút, order lookup 5/phút, chat text 5/phút, chat voice 5/phút), độ dài audio tối đa 60s ở `CHAT_VOICE_MAX_DURATION_SECONDS` trong `SendChatMessageUseCase`.

App không boot nếu thiếu hoặc sai env. Xem `.env.example` đầy đủ.

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `development` / `production` / ... |
| `HOST` / `PORT` | Bind address (default `localhost:3000`) |
| `LOG_LEVEL` | Pino log level |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_JWT_SECRET` | HMAC key cho JWT (min 32 chars) |
| `AUTH_ACCESS_TOKEN_TTL` | e.g. `15m` |
| `AUTH_REFRESH_TOKEN_TTL` | e.g. `30d` |
| `CORS_ORIGINS` | Comma-separated origins (phải có frontend origin) |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` | Cookie settings |
| `CUSTOMER_REGISTRATION_KEY` / `EMPLOYEE_REGISTRATION_KEY` | Header bắt buộc khi tạo tài khoản qua `POST /customers` / `POST /employees` |
| `STOREFRONT_URL` | Dùng trong link email xác nhận đơn hàng |
| `RESEND_API_KEY` / `RESEND_FROM` | Email order confirmation + security alert |
| `GEMINI_API_KEY` | AI chat + voice search + review classification + security agent (optional — thiếu thì các tính năng AI lỗi/fallback) |
| `SECURITY_AGENT_ENABLED` | Kill switch (ASI10) cho Security Agent — `false` = chỉ log, không tự hành động |
| `SECURITY_AGENT_ALERT_EMAIL` | Email admin nhận cảnh báo `ALERT_EMAIL` từ agent |
| `EMBEDDING_DIMENSION` | Số chiều output embedding (cột `products.embedding` là `halfvec(N)`). Đổi giá trị bắt buộc tạo migration mới + chạy lại `db:backfill` |
| `EXPOSE_INTERNAL_ERRORS` | `true` dev/staging, `false` prod |

**Generate secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"  # AUTH_JWT_SECRET
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
| `npm run db:backfill` | generate `products.embedding` for rows missing it |
| `npm run db:provision` | migrate + seed + backfill in one command |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |

## Endpoints overview

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | — |
| POST | `/api/v1/auth/employee-login`, `/customer-login` | — |
| POST | `/api/v1/auth/refresh`, `/logout` | refresh cookie |
| GET | `/api/v1/auth/me` | user |
| POST | `/api/v1/customers` | — (rate-limited, registration key) |
| GET/PATCH | `/api/v1/customers/me` | customer |
| GET/PATCH/DELETE | `/api/v1/customers/*` | admin/staff |
| GET/POST/PATCH/DELETE | `/api/v1/employees/*` | admin/staff |
| GET | `/api/v1/product-categories` | — |
| POST/PATCH/DELETE | `/api/v1/product-categories/*` | admin/staff |
| GET/POST | `/api/v1/product-properties/*` | admin/staff |
| GET | `/api/v1/products`, `/products/:id`, `/products/slug/:slug` | — |
| POST/PATCH/DELETE | `/api/v1/products` (+ `/categories`, `/variants/*`, `/variants/:id/properties`, `/variants/:id/stock/*`) | admin/staff |
| POST | `/api/v1/orders` | customer |
| GET | `/api/v1/orders/me` | customer |
| GET | `/api/v1/orders/lookup` | — (rate-limit riêng theo IP) |
| GET | `/api/v1/orders`, `/orders/:id` | admin/staff |
| PATCH | `/api/v1/orders/:id/status` | admin/staff |
| GET | `/api/v1/product-reviews/product/:productId` | — |
| POST | `/api/v1/product-reviews` | customer |
| GET/PATCH | `/api/v1/product-reviews`, `/:id`, `/:id/status` | admin/staff |
| POST | `/api/v1/product-reviews/:id/replies` | admin/staff |
| POST | `/api/v1/chat/text` | — (cần `GEMINI_API_KEY`) |
| POST | `/api/v1/chat/voice` | — (rate-limit riêng, cần `GEMINI_API_KEY`) |

## Example: create order

```json
{
  "items": [
    { "variantId": "550e8400-e29b-41d4-a716-446655440000", "quantity": 2 }
  ],
  "shippingFullName": "Nguyen Van A",
  "shippingAddress": "123 Le Loi, Q1, TP.HCM"
}
```

Server tự tính `name`/`priceCents`/`totalCents` từ DB — không nhận giá từ client. `customerEmail` lấy từ session đăng nhập.

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
| `403` | `FORBIDDEN` | Registration key sai, CSRF token sai/thiếu, IP bị chặn |
| `404` | `NOT_FOUND` | Resource not found |
| `409` | `CONFLICT` | Duplicate / invalid state transition / out of stock |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests |
| `502` | `EXTERNAL_SERVICE_ERROR` | External service failure (email, etc.) |
| `500` | `INTERNAL_ERROR` | Unexpected error |
| `503` | `AI_NOT_CONFIGURED` | Chat/voice search called without Gemini key |

Global rate limit: **100 requests/minute** (mọi route). Login/register/refresh, chat, voice search, order lookup có rate limit riêng.

## Conventions

- ESM imports end in `.ts` (NodeNext + `rewriteRelativeImportExtensions`) — rewritten to `.js` in `dist/` at build time
- Throw `AppError` subclasses from `src/lib/errors.ts` — never plain `Error` for client-facing errors
- Import validated `env` from `src/config/env.ts` — never read `process.env` directly
- `domain/` must be deterministic — no `Date.now()`, `Math.random()`, `crypto.randomUUID()`; pass time/ids from caller

## Code quality — tự đánh giá đối chiếu CLAUDE.md

Audit định kỳ (đọc code trực tiếp + grep, không dựa suy đoán) đối chiếu source thực tế với các rule tự đặt ra trong `CLAUDE.md`/`Code style`.

| Hạng mục | Trạng thái | Ghi chú |
|---|:---:|---|
| `check:arch` / `lint` / `typecheck` | ✅ Đạt | Cả 3 chạy sạch, không lỗi/warning |
| Không comment trong code | ✅ Đạt | Chỉ 1 ngoại lệ có chủ đích ở `customer.routes.ts` (giải thích lý do 1 route public dùng chung cho cả self-registration và admin tạo hộ) |
| `process.env` chỉ đọc qua `env.ts` | ✅ Đạt | Chỉ `env.ts` (validator) và `timezone.ts` (set `TZ` side-effect trước mọi import khác) đụng tới `process.env` trực tiếp |
| Role check (`requireRole`) đơn giản | ✅ Đạt | 6 dòng, `allowed.includes(req.user.role)`, không nested logic |
| Không fallback ngầm | ✅ Đạt | CSRF/role sai → `throw` thẳng, không có nhánh "log rồi vẫn cho qua" |
| Magic string cho role (`'admin'/'staff'/'customer'`) | ⚠️ Có, nhưng an toàn | Lặp lại ~46 chỗ ở route file thay vì 1 hằng số dùng chung, nhưng nhờ `AuthRole` là TypeScript union type nên gõ sai bị `tsc` chặn ngay — không phải magic string rủi ro runtime thật |
| `throw new Error(...)` thay vì `AppError` | ❌ Vi phạm rule | 21 chỗ ở repository/adapter/seed script (insert fail, TTL sai định dạng...) — đều là case "không nên xảy ra", nhưng đúng rule phải là `AppError` subclass |
| File ≤ ~150 dòng | ❌ Vi phạm rule (không enforce) | ~7 file vượt (150→364: `schema.ts`, `build-use-cases.ts`, `product-variant.repository.ts`, `product.repository.ts`, `product.controller.ts`, `product-review.repository.ts`, `customer.repository.ts`, `product.routes.ts`, `employee.repository.ts`, `security-agent.service.ts`, `app.ts`). Không có lint/CI nào chặn con số 150 — chỉ mang tính khuyến nghị. Các file vượt đều do phạm vi rộng (product có variant/category/property/stock), không phải code rối |

Không phát hiện god-file, abstraction thừa, hay leak giữa các layer kiến trúc.
