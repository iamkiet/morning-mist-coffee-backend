# Customer (`src/domain/customer`, `src/application/customer`)

- `POST /customers` — public, cần header registration key, dùng chung cho cả self-register và admin/staff tạo hộ
- `GET/PATCH /customers/me` — customer tự xem/sửa hồ sơ (không có `status`/`loyaltyPoints`)
- `GET/PATCH/DELETE /customers/:id`, `PATCH /customers/:id/password` — chỉ admin/staff
- Không có self-service đổi mật khẩu — chỉ admin/staff reset hộ qua `PATCH /:id/password`
- `q` search match: `first_name`, `last_name`, `email`, `phone`
