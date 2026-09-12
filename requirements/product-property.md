# Product Property — EAV (`src/domain/product-property`)

- 1 property = `name` + `dataType` (`text | number | enum`)
- Value gắn vào 1 variant + 1 property, unique theo cặp (variant, property)
- Set value: replace-all theo variant (`SetVariantPropertyValuesUseCase`), không patch từng field
- CRUD property — chỉ admin/staff
