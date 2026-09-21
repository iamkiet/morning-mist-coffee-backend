# Product Category (`src/domain/product-category`)

- CHỈ 1 CẤP — category có `parentId` thì `parentId` đó bắt buộc phải là category gốc (`parent.parentId === null`)
- Category đang có con (`hasChildren() === true`) thì KHÔNG được gán `parentId` cho nó (sẽ tạo cấp 2)
- `update`: category không được tự làm `parentId` của chính nó
- Validate ở cả `create` và `update` use case — không sửa 1 chỗ mà quên chỗ kia
- `name` unique (so sánh không phân biệt hoa/thường) — trùng thì `ConflictError`, check ở cả `create` và `update`
- Xóa category đang có con (`hasChildren() === true`) → `ConflictError`, không cho xóa
- Xóa category đang gắn với product thì KHÔNG bị chặn — `products_categories` cascade xóa theo (FK `onDelete: cascade` cả 2 chiều)
- `products_categories` là bảng join M:N product ↔ category
- `list()` trả flat array — build tree ở phía gọi (client hoặc use case), không build tree trong repo
- `SetProductCategoriesUseCase` (ở `application/product`) — replace-all danh mục của 1 product, validate mọi `categoryId` tồn tại trước khi gán, xong thì sync lại product embedding
- CRUD — chỉ admin/staff
