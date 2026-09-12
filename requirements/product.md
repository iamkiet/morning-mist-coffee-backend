# Product (`src/domain/product`, `src/application/product`)

- `products` chỉ giữ identity/copy: `slug`, `name`, `description`, `image`, `embedding` — KHÔNG có giá/SKU/stock
- Giá/SKU/stock nằm ở `product_variants` — 1 product → nhiều variant
- Tạo product bắt buộc kèm ít nhất 1 variant trong cùng request
- Slug:
  - tự derive từ `name` qua `slugify()` (NFD fold, `đ`→`d`)
  - dedupe bằng suffix `-2`, `-3`, ...
  - đổi tên product KHÔNG đổi slug
  - sửa slug là `PATCH { slug }` tường minh — 400 nếu sai định dạng, 409 nếu trùng
- Stock đổi qua `ProductVariantRepo`: `increaseStock` / `setStock` / `tryDecreaseStock` / `tryDecreaseStockBatch` — không dùng field scalar trực tiếp
- Categories: gán qua `PUT /products/:id/categories` — replace-all
- Variant properties (EAV): gán qua `PUT /products/variants/:id/properties` — replace-all
- Embedding:
  - `buildProductEmbeddingText()` gộp `name` + category (kể cả ancestor) + property values mọi variant + `description`
  - tự sinh lại sau: create/update product, set categories, set variant properties
  - best-effort — lỗi Gemini không fail request
- `q` search match: `name`, `description`, và EXISTS variant property value
