# Product Review (`src/domain/product-review`, `src/application/product-review`)

- Tạo review yêu cầu login `customer`
- `productId` bắt buộc, phải tồn tại (404 nếu không) — review luôn gắn với 1 product
- Status có 4 giá trị: `pending_classification` (default lúc insert, luôn bị ghi đè ngay trong cùng request bởi classify — chỉ còn tồn tại nếu process chết giữa `create()` và `classifyWithReply()`), `pending_reply`, `auto_responded`, `resolved`
- Public thấy MỌI review ngay sau khi submit, không phân biệt status — chỉ loại trừ `category = 'spam'` (cho phép `category IS NULL`, vd lúc classify chưa xong/fail). Reply (AI hoặc admin) được thêm sau, KHÔNG gate việc hiển thị review.
- Response public (`GET /product/:productId`) chỉ trả `id`, `rating`, `commentText`, `replies`, `createdAt` — không lộ `customerEmail`, `category`, `severity`, `sentiment`, `status`
- `GET /` (list) và `GET /:id` chỉ admin/staff — customer không có cách nào tự xem lại review mình đã gửi qua API riêng, chỉ thấy trên listing public (đã hiện ngay từ lúc submit, xem dòng trên)
- Classify đồng bộ lúc tạo review, qua Gemini (1 call, không retry loop), **chỉ chạy đúng 1 lần cho mỗi review**:
  ```
  Gemini fail                                → status = pending_reply
  confidence = low  OR  severity = high      → status = pending_reply
  ngược lại                                  → status = auto_responded (tự đăng reply AI)
  ```
- Không có cơ chế gán review cho 1 admin/staff cụ thể — `pending_reply` là hàng đợi chung, admin/staff filter theo `status=pending_reply` ở `mist-ops/product-reviews` rồi tự chọn review để trả lời, ai trả lời trước thì hết
- Mỗi review tối đa **1 reply** — tạo reply thứ 2 → `ConflictError`
- Chỉ admin/staff được tạo reply (`POST /:reviewId/replies`) — không có endpoint reply cho customer; customer muốn nói thêm thì viết review mới, hoặc hỏi Chat (tính năng khác hẳn)
- Reply do admin/staff tạo luôn có `authorType = 'admin'` bất kể actor là `admin` hay `staff` (chỉ AI reply mới có `authorType = 'ai'`)
- Admin tạo reply lúc đang `pending_reply` → tự động chuyển `resolved` luôn, không cần `PATCH /:id/status` riêng
- Admin/staff có thể force set status bất kỳ qua `PATCH /:id/status`
- FK: `product_id` cascade xoá review khi xoá product; `customer_id` set null khi xoá customer (giữ lại nội dung review); reply cascade xoá khi review bị xoá
