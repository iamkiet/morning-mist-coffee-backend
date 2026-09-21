# Product Category (`src/domain/product-category`)

- Category là FLAT — không có `parentId`/phân cấp (đã bỏ, xem migration `20260921150707_new_landau`)
- `name` unique (so sánh không phân biệt hoa/thường) — trùng thì `ConflictError`, check ở cả `create` và `update`
- Xóa category đang gắn với product thì KHÔNG bị chặn — `products_categories` cascade xóa theo (FK `onDelete: cascade` cả 2 chiều)
- `products_categories` là bảng join M:N product ↔ category
- `list()` trả về sort theo `name` (không cần build tree)
- `SetProductCategoriesUseCase` (ở `application/product`) — replace-all danh mục của 1 product, validate mọi `categoryId` tồn tại trước khi gán, xong thì sync lại product embedding
- Đổi `name` (`UpdateProductCategoryUseCase`) hoặc xóa category (`DeleteProductCategoryUseCase`) → sync lại embedding của MỌI product đang gắn category đó (`getProductIdsForCategory` + `syncProductEmbedding`), vì `buildProductEmbeddingText()` nhúng tên category vào text — không sync thì search/chat vẫn khớp theo tên category cũ
- `GET /product-categories` là PUBLIC (không cần login) — tên category không nhạy cảm, storefront dùng để build filter danh mục cho khách vãng lai; `POST`/`PATCH`/`DELETE` vẫn admin/staff-only
