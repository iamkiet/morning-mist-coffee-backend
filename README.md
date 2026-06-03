# backend

Modern Fastify + TypeScript backend with an n-tier layout. Drizzle ORM (PostgreSQL), TypeBox schemas, OpenAI adapter, OpenAPI docs.

## Stack

- **Runtime**: Node.js 22+, ESM, TypeScript 5.7
- **HTTP**: Fastify 5 + `@fastify/type-provider-typebox` (compile-time + runtime types from one schema)
- **Validation**: TypeBox (request/response), Zod (env)
- **DB**: PostgreSQL via Drizzle ORM 0.38 (`postgres-js` driver)
- **External**: OpenAI SDK
- **Docs**: `@fastify/swagger` → `/docs`
- **Security**: `@fastify/helmet`, `@fastify/cors`

## Layout

```
src/
  server.ts            entry — bootstraps app + signals
  app.ts               builds Fastify, registers plugins, error handler
  config/env.ts        Zod-validated env
  db/
    client.ts          drizzle + postgres-js connection
    schema.ts          drizzle tables (orders)
  lib/
    errors.ts          AppError taxonomy
    openai.ts          OpenAI client
  types/               row → DTO mappers
  schemas/             TypeBox request/response schemas
  repositories/        SQL only (drizzle)
  adapters/            external API wrappers
  services/            business logic
  controllers/         req/res glue
  routes/              endpoint registration + DI
  middlewares/auth.ts  bearer auth hook
drizzle.config.ts
```

Flow: `routes → controllers → services → repos/adapters → clients`

## Setup

```bash
cp .env.example .env       # fill in DATABASE_URL + generated secrets (see below)
npm install
npm run db:push            # create tables in dev (or db:generate + db:migrate)
npm run dev                # http://localhost:3000  ·  docs at /docs
```

## Secrets to generate

The app refuses to boot if any of these are missing or too short. Generate fresh values per environment — never reuse dev secrets in prod.

| Env var                 | Purpose                                                                    | How to generate                                                                  | Requirement  |
| ----------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------ |
| `AUTH_JWT_SECRET`       | HMAC key for signing access + refresh JWTs (HS256)                         | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` | min 32 chars |
| `USER_REGISTRATION_KEY` | Gate for `POST /api/v1/auth/register` via `X-User-Registration-Key` header | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` | min 32 chars |

Both use `crypto.randomBytes` → cryptographically random, base64url encoded (URL/header-safe, no padding). 32 bytes = 256-bit entropy.

Comparison is timing-safe (`crypto.timingSafeEqual`) for the registration key, and JWT signature verify (constant-time) for the JWT secret.

## Scripts

| Script                | Purpose                             |
| --------------------- | ----------------------------------- |
| `npm run dev`         | tsx watch mode                      |
| `npm run build`       | TypeScript build to `dist/`         |
| `npm start`           | run compiled `dist/server.js`       |
| `npm run typecheck`   | `tsc --noEmit`                      |
| `npm run db:generate` | generate SQL migrations from schema |
| `npm run db:migrate`  | apply migrations                    |
| `npm run db:push`     | push schema directly (dev)          |
| `npm run db:studio`   | drizzle studio                      |

## Endpoints

All routes require `Authorization: Bearer <AUTH_JWT_SECRET>` (placeholder verifier in [src/middlewares/auth.ts](src/middlewares/auth.ts) — swap in `@fastify/jwt` or `jose` for production).

- `GET    /health`
- `GET    /docs` — Swagger UI
- `GET    /api/v1/orders`
- `POST   /api/v1/orders`
- `GET    /api/v1/orders/:id`
- `PATCH  /api/v1/orders/:id/status` — enforces a state machine

## Swapping HTTP layer

The HTTP boundary (`server.ts`, `app.ts`, `routes/`) is the only Fastify-aware code. Controllers receive request/reply types but the underlying logic in `services/` and below is framework-agnostic — port routes to Hono/Express without touching business logic.

---

## AI Chat Assistant

### 🛠️ Structure
- **Frontend Widget** ([ChatWidget.tsx](file:///Users/kietnguyen/iamkiet/morning-mist-coffee-frontend/components/chat/ChatWidget.tsx)): Quản lý UI khung chat, render tin nhắn Markdown tự động bằng thư viện `react-markdown`.
- **Frontend Hook** ([useChat.ts](file:///Users/kietnguyen/iamkiet/morning-mist-coffee-frontend/hooks/use-chat.ts)): Quản lý trạng thái và xử lý gửi tin nhắn bất đồng bộ lên `/api/v1/chat`.
- **Backend Route** ([chat.routes.ts](file:///Users/kietnguyen/iamkiet/morning-mist-coffee-backend/src/presentation/routes/chat.routes.ts)): Đăng ký endpoint nhận tin nhắn POST `/api/v1/chat`.
- **Backend Controller** ([chat.controller.ts](file:///Users/kietnguyen/iamkiet/morning-mist-coffee-backend/src/presentation/controllers/chat.controller.ts)): Tiếp nhận lịch sử hội thoại, tự động bơm dữ liệu sản phẩm làm ngữ cảnh và gọi Gemini.
- **AI Model**: Sử dụng mô hình **`gemini-3.5-flash`** thông qua SDK `@google/generative-ai`.

### 💡 Chức năng
- **Tư vấn sản phẩm thời gian thực (Basic RAG)**: Tự động truy vấn danh sách 50 sản phẩm mới nhất từ cơ sở dữ liệu (tên, mô tả, giá tiền quy đổi) và nạp vào prompt để AI tư vấn giá cả, hương vị chính xác tuyệt đối.
- **Duy trì ngữ cảnh hội thoại (Contextual History)**: Tự động chuẩn hóa lịch sử chat luân phiên (`user` - `model`), gộp các tin nhắn trùng vai trò để AI nhớ thông tin hội thoại liên tục.
- **Persona Nhã nhặn & Tối giản**: AI được định hình tính cách ân cần, thanh lịch và tối giản (Organic Minimalism) đúng tinh thần thương hiệu của Morning Mist Coffee.

---

## AI Security Check (WAF)

Hệ thống tích hợp một lớp kiểm duyệt bảo mật bằng AI (`AiSecurityService`) chạy bất đồng bộ để phân tích payloads đăng ký và đăng nhập, phát hiện các cuộc tấn công phổ biến như SQL Injection, XSS, Path Traversal.

### 🛠️ Cơ chế hoạt động
1. **Background Job (Non-blocking)**: Hoạt động song song và bất đồng bộ, không ảnh hưởng đến thời gian phản hồi của client.
2. **Safe Payload Caching**: Lưu trữ các payload an toàn đã được kiểm duyệt vào cache (tối đa 1000 items) nhằm giảm thiểu chi phí và tối ưu hóa tốc độ bằng cách bỏ qua các request trùng lặp.
3. **Cảnh báo (Red Alert)**: Ghi nhận log level `error` kèm chuỗi cảnh báo sinh động `🔴 AI SYSTEM DETECTED A MALICIOUS ATTACK!` nếu phát hiện nguy hại.

### 🧪 Kịch bản kiểm thử (Test Scenarios)

#### 1. Kiểm thử Unit/Service độc lập qua Script
Hệ thống cung cấp một script chạy trực tiếp để kiểm tra logic lọc của Gemini WAF:
```bash
npx tsx --env-file=.env src/test-ai-security.ts
```
**Kết quả mong đợi:**
- **Safe Payload**: Không phát sinh cảnh báo.
- **SQL Injection / XSS Payload**: In ra log `[ERROR] 🔴 AI SYSTEM DETECTED A MALICIOUS ATTACK!` kèm thông tin IP và payload tương ứng.

#### 2. Kiểm thử Tích hợp (API Integration Test)
Khởi động backend server bằng `npm run dev` và gửi request mẫu bằng `curl` để theo dõi log thực tế:

- **Test Case 1: Đăng nhập An toàn (SAFE)**
  ```bash
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "customer@morningmist.com", "password": "SecurePassword123!"}'
  ```
  *Kết quả: Server trả về token bình thường, không sinh log cảnh báo bảo mật.*

- **Test Case 2: Tấn công SQL Injection (DANGEROUS)**
  ```bash
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@morningmist.com'\'' OR '\''1'\''='\''1", "password": "any"}'
  ```
  *Kết quả: Log của server xuất hiện dòng cảnh báo: `🔴 AI SYSTEM DETECTED A MALICIOUS ATTACK!`.*

- **Test Case 3: Đăng ký với XSS Payload (DANGEROUS)**
  ```bash
  curl -X POST http://localhost:3000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "firstName": "<script>alert('\''xss'\'')</script>",
      "lastName": "Nguyen",
      "email": "hacker@morningmist.com",
      "password": "Password123!"
    }'
  ```
  *Kết quả: Server in ra log cảnh báo bảo mật.*

