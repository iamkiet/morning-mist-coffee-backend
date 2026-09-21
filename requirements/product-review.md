# Product Review (`src/domain/product-review`, `src/application/product-review`)

- Tạo review yêu cầu login `customer`
- `productId` bắt buộc, phải tồn tại (404 nếu không) — review luôn gắn với 1 product
- Status có 4 giá trị: `pending_classification` (default lúc insert — vì classify chạy fire-and-forget, review có thể đứng ở status này vài giây thật sự, không chỉ lý thuyết), `pending_reply`, `auto_responded`, `resolved`
- Category có 5 giá trị: `complaint`, `compliment`, `suggestion`, `spam`, `unclassified` (gắn khi Gemini gọi lỗi, xem dòng dưới) — `category` là NULL trong lúc còn `pending_classification` (chưa classify xong)
- Public thấy MỌI review ngay sau khi submit, không phân biệt status — chỉ loại trừ `category = 'spam'` (cho phép `category IS NULL`, vd lúc classify chưa xong/fail). Reply (AI hoặc admin) được thêm sau, KHÔNG gate việc hiển thị review.
- Response public (`GET /product/:productId`) chỉ trả `id`, `rating`, `commentText`, `replies`, `createdAt` — không lộ `customerEmail`, `category`, `severity`, `sentiment`, `status`
- `GET /` (list) và `GET /:id` chỉ admin/staff — customer không có cách nào tự xem lại review mình đã gửi qua API riêng, chỉ thấy trên listing public (đã hiện ngay từ lúc submit, xem dòng trên)
- `POST /product-reviews` trả response NGAY sau khi insert (status `pending_classification`, `category` NULL) — classify chạy **fire-and-forget** phía sau (không await), không block response. Customer thấy "gửi thành công" ngay, review cũng public ngay (xem dòng trên)
- Classify qua Gemini (1 call, không retry loop), **chỉ chạy đúng 1 lần cho mỗi review**:
  ```
  Gemini fail                                → status = pending_reply, category = 'unclassified', severity = 'high' (repo.markClassificationFailed)
  confidence = low  OR  severity = high      → status = pending_reply
  ngược lại                                  → status = auto_responded (tự đăng reply AI)
  ```
- Không có cơ chế gán review cho 1 admin/staff cụ thể — `pending_reply` là hàng đợi chung, admin/staff filter theo `status=pending_reply` ở `mist-ops/product-reviews` rồi tự chọn review để trả lời, ai trả lời trước thì hết
- Mỗi review tối đa **1 reply** — tạo reply thứ 2 → `ConflictError`. FE (`mist-ops/product-reviews`) chỉ hiện form trả lời khi status là `pending_classification`/`pending_reply` — `auto_responded`/`resolved` đã có reply rồi nên ẩn form (tránh gọi API chắc chắn 409)
- Chỉ admin/staff được tạo reply (`POST /:reviewId/replies`) — không có endpoint reply cho customer; customer muốn nói thêm thì viết review mới, hoặc hỏi Chat (tính năng khác hẳn)
- Reply do admin/staff tạo luôn có `authorType = 'admin'` bất kể actor là `admin` hay `staff` (chỉ AI reply mới có `authorType = 'ai'`)
- Admin tạo reply lúc đang `pending_reply` HOẶC `pending_classification` → tự động chuyển `resolved` luôn, không cần `PATCH /:id/status` riêng
- Race admin-reply vs AI-classify (cả 2 xảy ra gần như đồng thời vì classify async): `classifyWithReply` (trong transaction) check đã có reply chưa trước khi chèn AI reply — nếu admin đã trả lời trước thì bỏ qua AI reply, set status `resolved` thay vì ghi đè theo kết quả classify, không bao giờ tạo ra 2 reply
- Admin/staff có thể force set status bất kỳ qua `PATCH /:id/status`
- FK: `product_id` cascade xoá review khi xoá product; `customer_id` set null khi xoá customer (giữ lại nội dung review); reply cascade xoá khi review bị xoá
