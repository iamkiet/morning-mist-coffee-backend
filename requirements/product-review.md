# Product Review (`src/domain/product-review`, `src/application/product-review`)

- Tạo review yêu cầu login `customer`
- `productId` bắt buộc, phải tồn tại (404 nếu không) — review luôn gắn với 1 product
- Public chỉ thấy review khi: `category != 'spam' AND status IN ('auto_responded', 'resolved')`
- Classify đồng bộ lúc tạo review, qua Gemini (1 call, không retry loop), **chỉ chạy đúng 1 lần cho mỗi review**:
  ```
  Gemini fail                                → status = pending_reply
  confidence = low  OR  severity = high      → status = pending_reply
  ngược lại                                  → status = auto_responded (tự đăng reply AI)
  ```
- Mỗi review tối đa **1 reply** — tạo reply thứ 2 → `ConflictError`
- Chỉ admin/staff được tạo reply (`POST /:reviewId/replies`) — không có endpoint reply cho customer; customer muốn nói thêm thì viết review mới, hoặc hỏi Chat (tính năng khác hẳn)
- Admin tạo reply lúc đang `pending_reply` → tự động chuyển `resolved` luôn, không cần `PATCH /:id/status` riêng
- Admin/staff có thể force set status bất kỳ qua `PATCH /:id/status`
