# Product Review (`src/domain/product-review`, `src/application/product-review`)

- Tạo review / customer reply đều yêu cầu login `customer`
- Customer được reply lên review của BẤT KỲ ai, không chỉ review của chính mình — đây là chủ đích, không phải bug, đừng thêm check ownership
- `productId` bắt buộc, phải tồn tại (404 nếu không) — review luôn gắn với 1 product
- Classify đồng bộ lúc tạo review, qua Gemini (1 call, không retry loop):
  ```
  Gemini fail                                → status = pending_review
  confidence = low  OR  severity = high      → status = pending_review
  ngược lại                                  → status = auto_responded (tự đăng reply AI)
  ```
- Customer reply tiếp trên review của mình → reclassify lại từ đầu
- Admin/staff reply → KHÔNG reclassify
- Public chỉ thấy review khi: `category != 'spam' AND status IN ('auto_responded', 'resolved')`
- Admin/staff có thể force set status bất kỳ qua `PATCH /:id/status`
