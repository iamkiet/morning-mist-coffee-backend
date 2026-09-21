# Product Property — EAV (`src/domain/product-property`)

- 1 property = `name` + `dataType` (`text | number | enum`, mặc định `text` nếu không truyền)
- `name` unique (case-insensitive) — trùng tên thì `ConflictError`
- Value gắn vào 1 variant + 1 property, unique theo cặp (variant, property)
- Set value: replace-all theo variant (`SetVariantPropertyValuesUseCase`), không patch từng field — validate variant tồn tại và mọi `propertyId` tồn tại (404 nếu thiếu), rồi đồng bộ lại embedding của product
- Chỉ có tạo + danh sách property (`CreateProductPropertyUseCase`, `ListProductPropertiesUseCase`) — chưa có update/delete property definition, chỉ admin/staff
- Property bị xóa (nếu có, hiện chưa có API) → cascade xóa hết value liên quan ở DB (`onDelete: 'cascade'`)
