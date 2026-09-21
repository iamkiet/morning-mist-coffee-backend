# Order (`src/domain/order`, `src/application/order`)

- `POST /orders` yêu cầu login `customer` — KHÔNG có guest checkout
- `customerEmail` lấy từ session (`req.user.email`) — KHÔNG nhận từ request body
- Server luôn ghi đè `name`/`priceCents` từ DB — không tin giá/tên client gửi lên
- Giảm stock batch trước khi lưu order — fail nếu bất kỳ item nào hết hàng (`tryDecreaseStockBatch`)
- Nếu `repo.create()` fail SAU khi đã trừ stock → tự động hoàn lại stock (compensation) trước khi throw lỗi
- Order chuyển sang `cancelled` (từ `pending`/`paid`) → tự động hoàn stock cho mọi item có `productVariantId`
- Order status state machine (`canTransition()`, bỏ bước → `409 CONFLICT`):
  ```
  pending  → paid | cancelled
  paid     → shipped | cancelled
  shipped  → delivered
  delivered, cancelled → (terminal)
  ```
- `shippingFullName` + `shippingAddress` + `shippingPhone` bắt buộc lúc tạo (nullable ở DB — order cũ trước khi field này tồn tại)
- `cashReceivedCents` (nếu gửi) phải >= `totalCents`, `changeCents` server tự tính (không nhận từ client)
- `GET /orders/lookup?code=` — public, rate-limit theo IP (`ORDER_LOOKUP_RATE_MAX`/`ORDER_LOOKUP_RATE_WINDOW`), `code` phải là full order id (UUID), trả `{ items: [] | [order] }`
- `GET /orders/me` — login `customer`, tự lọc theo `req.user.email` (không nhận `customerEmail` query)
- `q` search match: `email` (partial), `id` (prefix), `status`
