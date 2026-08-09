# Morning Mist Coffee — Backend

Backend API cho cửa hàng cà phê **Morning Mist Coffee**. Fastify 5 + TypeScript, clean architecture, PostgreSQL + pgvector (Drizzle ORM), JWT auth, quản lý sản phẩm/đơn hàng, email xác nhận (Resend), AI chat tư vấn, voice semantic search và Security Agent tự động cảnh báo.

Chi tiết từng endpoint: Swagger UI tại `/documents` khi server chạy (tự sinh từ Zod schema, luôn khớp thực tế).

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
| AI | Google Gemini (`gemini-3.6-flash`) — chat assistant + security agent |
| Security | `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit` |

## Architecture

Clean architecture — inner layers không import outer layers (enforced bởi `npm run check:arch`).

```
domain/          entities, repo interfaces, ports — no framework, no I/O
application/     use cases — depend only on domain abstractions
infrastructure/  Drizzle repos, adapters (jose, bcrypt, resend) — implements ports
presentation/    Fastify routes, controllers, schemas, serializers, plugins, middlewares
```

**Domains:** `user`, `auth` (refresh token), `product`, `product-type`, `order`, `chat`

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

- **Public:** list (search, filter, sort, paginate, kèm `stockQuantity`), get by id, get by slug (`GET /api/v1/products/slug/:slug`, dùng cho trang chi tiết sản phẩm)
- **Admin:** create, update, delete
- **Slug:** derive tự động từ `name`, dedupe bằng suffix `-2`, `-3`, …; đổi tên sản phẩm **không** đổi slug — sửa slug là `PATCH { slug }` tường minh (400 nếu sai định dạng, 409 nếu trùng)
- **Stock (admin):** tồn kho lưu bảng `product_stock` riêng — get / increase / decrease

Giá lưu bằng **cents**, currency hiện chỉ hỗ trợ **VND**.

### Orders

- **Public:** `POST /api/v1/orders` — khách đặt hàng bằng email (không dùng `customerId`)
- **Public:** `GET /api/v1/orders/lookup?email=&code=` — tra cứu đơn theo email (guest checkout không có tài khoản, không thể ép login). Fix A01 IDOR gồm 2 lớp:
  - **Bắt buộc mã đơn hàng** (`code`, 8 ký tự hex đầu của order id, in trên biên nhận) bên cạnh email. Trước đây chỉ cần email là trả về tối đa 50 đơn kèm toàn bộ chi tiết — ai biết/đoán được email khách là đọc được lịch sử mua hàng. Nay phải biết cả email **và** mã đơn, và chỉ trả về đúng 1 đơn khớp.
  - **Rate-limit riêng theo IP + email** (`ORDER_LOOKUP_RATE_MAX`/`ORDER_LOOKUP_RATE_WINDOW`, default 5 req/phút) — key gồm cả email nên đổi IP không reset được counter của 1 email, chặn dò mã đơn hàng loạt. Trước đây route này chỉ nằm dưới rate-limit chung 100 req/phút/IP.
- **Admin:** list, get by id, cập nhật status

**Create order flow:**

1. Validate từng item — `productId` bắt buộc, product phải tồn tại, currency khớp
2. Server **ghi đè** `name` / `priceCents` từ DB (chống sửa giá client-side)
3. Giảm stock batch — fail nếu hết hàng
4. Tính lại `totalCents`; tùy chọn `cashReceivedCents` → tính `changeCents`
5. Lưu order + items + thông tin giao hàng (`shippingFirstName`/`shippingLastName`/`shippingAddress`/`shippingCity`/`shippingPostalCode`, bắt buộc trên mọi order mới — nullable trong response vì order đặt trước khi field này tồn tại không có giá trị); gửi email xác nhận qua Resend (best-effort, không block nếu email fail)

**Order status state machine** (bỏ bước sẽ bị `409 CONFLICT`):

```
pending  → paid | cancelled
paid     → shipped | cancelled
shipped  → delivered
delivered → (terminal)
cancelled → (terminal)
```

### Voice Semantic Search

`POST /api/v1/search/voice` — public, rate-limit riêng (`SEARCH_VOICE_RATE_MAX`/`SEARCH_VOICE_RATE_WINDOW`).

- **Audio-native + transcript, cả hai đều dùng để search**: audio ghi âm (webm/wav/mp3/ogg, tối đa 10MB và `SEARCH_VOICE_MAX_DURATION_SECONDS` giây — độ dài được ffprobe kiểm tra và reject **trước** khi tốn công convert) được convert sang WAV qua ffmpeg, rồi (a) transcribe bằng `gemini-3.6-flash` ra transcript, và (b) embed thẳng bằng `gemini-embedding-2` (`embedAudioQuery`, task type `RETRIEVAL_QUERY` — cùng model, cùng không gian vector với embedding sản phẩm, không trộn model khác) để so khớp cosine similarity. Vector đi vào `SendChatMessageUseCase.replyToMessage` cùng transcript.
- Transcript **không chỉ để hiển thị UI** — nó được dùng để: trích ràng buộc giá (`ProductFilterExtractionPort`), làm câu hỏi cho keyword fallback (`ilike`) khi vector search rỗng/lỗi, và làm message cho Gemini soạn câu trả lời tự nhiên (`ChatPort.reply`).
- Fallback không dựa trên ngưỡng similarity cấu hình được — logic nằm trong `SendChatMessageUseCase.retrieveByVector`: vector search lỗi hoặc rỗng → fallback `ilike` theo transcript (giữ nguyên filter giá) → nếu vẫn rỗng, fallback danh sách mới nhất (vẫn giữ filter giá).
- Đã kiểm chứng thực nghiệm ở `scripts/spike/voice-search-spike.ts` trước khi build: 91.7% top-3 accuracy trên bộ câu hỏi tiếng Việt mẫu (100% câu nói tên sản phẩm, 85.7% câu mô tả mơ hồ) — số liệu + script giữ lại làm bằng chứng thực nghiệm.
- Embedding sản phẩm (cột `products.embedding`, `halfvec(3072)`, HNSW index `halfvec_cosine_ops`) nhúng từ `name`/`type` (tên loại sản phẩm)/`origin`/`tastingNotes`/`description` (`syncProductEmbedding`, dùng chung bởi create/update/backfill), tự động sinh lại khi bất kỳ field nào trong số đó đổi, kể cả đổi `productTypeId` (hook trong `CreateProductUseCase`/`UpdateProductUseCase`, best-effort — lỗi Gemini không làm fail request tạo/sửa sản phẩm). Backfill sản phẩm cũ: `npm run db:backfill-embeddings`.
- **Vì sao `halfvec` chứ không phải `vector`**: `gemini-embedding-2` trả về 3072 chiều, trong khi pgvector giới hạn index (HNSW/IVFFlat) ở **2000 chiều** cho kiểu `vector` — `CREATE INDEX ... USING hnsw` trên `vector(3072)` fail thẳng với lỗi `column cannot have more than 2000 dimensions for hnsw index`. Kiểu `halfvec` (fp16, pgvector ≥ 0.7) nâng trần index lên 4000 chiều, nên giữ nguyên được đủ 3072 chiều mà vẫn index được. Đây là lựa chọn kỹ thuật đáng nêu trong báo cáo: giải pháp thay thế là hạ số chiều xuống 1536 (mất thông tin) hoặc bỏ index (full scan mọi query).

### AI Chat Assistant

`POST /api/v1/chat` — public, không cần auth, rate-limit riêng (`CHAT_RATE_MAX`/`CHAT_RATE_WINDOW`).

- Model: `gemini-3.6-flash`
- Persona: trợ lý Morning Mist Coffee, trả lời tiếng Việt, phong cách nhã nhặn tối giản
- **RAG bằng vector:** embed tin nhắn mới nhất của khách (`MultimodalEmbeddingPort.embedQuery` — `RETRIEVAL_QUERY`, khác task type với `embedDocument` dùng khi index sản phẩm), lấy 8 sản phẩm gần nhất theo cosine similarity trên cùng chỉ mục `pgvector` mà voice search dùng (`findSimilarByVector`), rồi mới tiêm vào system prompt — không còn nạp tĩnh N sản phẩm mới nhất. Song song đó, `ProductFilterExtractionPort` (Gemini structured output) trích ràng buộc giá (VND) nếu khách có nêu, áp thành `WHERE priceCents BETWEEN ...` trong cùng query — vector similarity không tự hiểu được ngưỡng số. Nếu vector không có kết quả (embedding chưa sinh), fallback tìm kiếm từ khoá (`ilike`) rồi tới danh sách sản phẩm mới nhất, cả hai đều giữ nguyên filter giá, đảm bảo không bao giờ trả lời với catalogue rỗng hoặc gợi ý sai khoảng giá.
- Duy trì lịch sử hội thoại (chuẩn hóa luân phiên user/model)
- Trả về `{ "message": "..." }`
- Cần `GEMINI_API_KEY`; thiếu key → `503 AI_NOT_CONFIGURED`
- **Fail-soft ở bước soạn câu trả lời**: nếu `ChatPort.reply` lỗi (hết quota, timeout, lỗi mạng — sau khi retrieval đã xong) thì **không** trả lỗi cho client — trả `200` với message xin lỗi cố định (`FALLBACK_REPLY` trong `SendChatMessageUseCase`), voice search vẫn kèm `items` tìm được bình thường vì retrieval không phụ thuộc bước này. Khác với việc thiếu `GEMINI_API_KEY` hẳn (fail cứng `503` vì không thể chạy embedding/retrieval nào cả).

### Prompt Injection (A05) — phòng thủ

AI WAF đã bị bỏ (không cần thiết cho phạm vi đồ án — A05/Injection thật sự được chặn bằng Drizzle tham số hoá + Zod validate, không phụ thuộc AI). Phòng thủ prompt injection giờ chỉ còn ở bề mặt LLM duy nhất còn lại — chat:

- **Chat** (`chat.controller.ts`): mọi tin nhắn của khách (cả lịch sử hội thoại lẫn tin nhắn hiện tại, role `user`) được bọc trong tag `<user_message>`; system instruction nêu rõ không được thực thi/đi theo chỉ thị nằm trong tag đó, kể cả khi nó yêu cầu bỏ qua chỉ thị trước, lộ system prompt, hay đổi persona. Phản hồi của chính assistant (role `model`) không bọc vì đó là output tin cậy của hệ thống.

> `scripts/spike/prompt-injection-spike.ts` là script đo thực nghiệm cũ, từng đo cả nhánh WAF (đã xoá) lẫn nhánh chat — hiện chỉ còn phần đo chat còn phù hợp, phần đo WAF trong script/log cũ (`prompt-injection-first-run.log`) không còn phản ánh hệ thống hiện tại.

### Security Agent (A09 logging + OWASP ASI Top 10 2026)

Agentic AI job (`SecurityAgentService`, chạy mỗi 60s trong tiến trình backend) đọc log sự kiện bảo mật gần đây (login fail, register fail, WAF block/suspicious, rate-limit hit — thu thập qua `SecurityEventStore`, giữ trong 5 phút gần nhất) và giao cho Gemini quyết định action: `IGNORE` | `LOG_ONLY` | `ALERT_EMAIL` | `TEMP_BLOCK_IP` (structured output, ép Zod-tương-đương enum).

Vì agent có quyền tự hành động (gửi email, block IP), thiết kế áp dụng thêm **OWASP Top 10 for Agentic Applications 2026**:

- **ASI01** — nội dung event (user-agent, email...) được coi là input không đáng tin, sanitize (strip non-printable + ký tự template) trước khi đưa vào prompt, bọc `<events>` tag + chỉ thị không theo lệnh giả bên trong.
- **ASI02** — action phải nằm trong allow-list cố định (reject nếu Gemini trả action lạ); rate-limit riêng cho hành động thật (`ALERT_EMAIL`/`TEMP_BLOCK_IP`, tối đa 5 lần/10 phút).
- **ASI06** — lịch sử block/event đều có TTL/expiry, không tồn tại vĩnh viễn.
- **ASI08** — circuit breaker: quá 3 lần `TEMP_BLOCK_IP` trong 10 phút → tự hạ xuống `LOG_ONLY`.
- **ASI09** — nội dung `reason` do Gemini sinh ra trong email cảnh báo chỉ render **plain text**, không HTML/link.
- **ASI10** — kill switch `SECURITY_AGENT_ENABLED=false` tắt hoàn toàn hành động tự động, agent chỉ còn log.

`TEMP_BLOCK_IP` chặn IP 5 phút qua `IpBlockList` (in-memory), kiểm tra ở `onRequest` hook toàn app (trừ `/health`, `/ready`) → `403 FORBIDDEN`.

### Health

- `GET /health` — uptime + DB check (`200` ok / `503` degraded)
- `GET /ready` — readiness probe

## Setup

```bash
cp .env.example .env
docker compose up -d pg-db   # image pgvector/pgvector:pg18 — cần cho voice search
npm install
npm run db:migrate           # áp migration có sẵn (bao gồm extension pgvector + cột embedding)
npm run db:seed              # optional: seed product types + products
npm run db:backfill-embeddings  # optional: sinh embedding cho sản phẩm đã seed (cần GEMINI_API_KEY)
npm run dev                  # http://localhost:3000
```

Production: dùng `npm run db:generate` + `npm run db:migrate` (không dùng `db:push`, để có file migration SQL làm bằng chứng thay đổi schema).

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
| `GEMINI_API_KEY` | AI chat + security WAF + security agent + voice search (optional — dùng heuristic fallback nếu thiếu, voice search sẽ lỗi nếu thiếu) |
| `SECURITY_AGENT_ENABLED` | Kill switch (ASI10) cho Security Agent — `false` = chỉ log, không tự hành động |
| `SECURITY_AGENT_ALERT_EMAIL` | Email admin nhận cảnh báo `ALERT_EMAIL` từ agent |
| `EMBEDDING_DIMENSION` | Số chiều output của `gemini-embedding-2` (cột `products.embedding` là `halfvec(N)`). Đổi giá trị này bắt buộc tạo migration mới + chạy lại `db:backfill-embeddings` |
| `SEARCH_VOICE_SIMILARITY_THRESHOLD` | Ngưỡng cosine similarity (0-1) để quyết định dùng kết quả audio-native hay fallback keyword search |
| `SEARCH_VOICE_MAX_DURATION_SECONDS` | Độ dài audio tối đa chấp nhận (dưới hẳn giới hạn 180s của `gemini-embedding-2`) |
| `SEARCH_VOICE_RATE_MAX` / `SEARCH_VOICE_RATE_WINDOW` | Rate limit riêng cho `/api/v1/search/voice` |
| `ORDER_LOOKUP_RATE_MAX` / `ORDER_LOOKUP_RATE_WINDOW` | Rate limit riêng cho `/api/v1/orders/lookup`, key theo IP + email (fix A01 IDOR) |
| `AUTH_LOGIN_RATE_MAX` / `AUTH_LOGIN_RATE_WINDOW` | Rate limit cho login/register/refresh |
| `CHAT_RATE_MAX` / `CHAT_RATE_WINDOW` | Rate limit riêng cho `/api/v1/chat` |
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
| `npm run db:backfill-embeddings` | generate `products.embedding` for rows missing it |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |

## Endpoints overview

| Method | Path | Auth |
|--------|------|------|
| GET | `/health`, `/ready` | — |
| POST | `/api/v1/auth/register` | registration key |
| POST | `/api/v1/auth/login` | — |
| POST | `/api/v1/auth/refresh`, `/logout` | refresh token |
| GET | `/api/v1/auth/me` | user |
| GET/PATCH | `/api/v1/users/*` | admin |
| GET/POST | `/api/v1/product-types/*` | user |
| GET | `/api/v1/products`, `/api/v1/products/:id`, `/api/v1/products/slug/:slug` | — |
| POST/PATCH/DELETE | `/api/v1/products/*` | admin |
| GET/POST | `/api/v1/products/:id/stock/*` | admin |
| POST | `/api/v1/orders` | — |
| GET | `/api/v1/orders/lookup` | — (rate-limit riêng, xem `ORDER_LOOKUP_RATE_MAX`) |
| GET | `/api/v1/orders`, `/api/v1/orders/:id` | admin |
| PATCH | `/api/v1/orders/:id/status` | admin |
| POST | `/api/v1/chat` | — (cần `GEMINI_API_KEY`) |
| POST | `/api/v1/search/voice` | — (rate-limit riêng, cần `GEMINI_API_KEY`) |

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
| `403` | `FORBIDDEN` | Registration key sai, CSRF token sai/thiếu, IP bị chặn |
| `404` | `NOT_FOUND` | Resource not found |
| `409` | `CONFLICT` | Duplicate / invalid state transition / out of stock |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests |
| `502` | `EXTERNAL_SERVICE_ERROR` | External service failure (email, etc.) |
| `500` | `INTERNAL_ERROR` | Unexpected error |
| `503` | `AI_NOT_CONFIGURED` | Chat called without Gemini key |

Global rate limit: **100 requests/minute** (mọi route). Login/register/refresh có rate limit riêng qua `AUTH_LOGIN_RATE_*`.

## Conventions

- ESM imports end in `.ts` (NodeNext + `rewriteRelativeImportExtensions`) — rewritten to `.js` in `dist/` at build time
- Throw `AppError` subclasses from `src/lib/errors.ts` — never plain `Error` for client-facing errors
- Import validated `env` from `src/config/env.ts` — never read `process.env` directly
- `domain/` must be deterministic — no `Date.now()`, `Math.random()`, `crypto.randomUUID()`; pass time/ids from caller
