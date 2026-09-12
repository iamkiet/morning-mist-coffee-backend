# Product Category (`src/domain/product-category`)

- CHỈ 1 CẤP — category có `parentId` thì `parentId` đó bắt buộc phải là category gốc (`parent.parentId === null`)
- Category đang có con (`hasChildren() === true`) thì KHÔNG được gán `parentId` cho nó (sẽ tạo cấp 2)
- Validate ở cả `create` và `update` use case — không sửa 1 chỗ mà quên chỗ kia
- `products_categories` là bảng join M:N product ↔ category
- `list()` trả flat array — build tree ở phía gọi (client hoặc use case), không build tree trong repo
- CRUD — chỉ admin/staff
