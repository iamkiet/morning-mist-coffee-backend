# Customer (`src/domain/customer`, `src/application/customer`)

- `POST /customers` — public, cần header registration key, dùng chung cho cả self-register và admin/staff tạo hộ
- `GET/PATCH /customers/me` — customer tự xem/sửa hồ sơ (không có `status`/`loyaltyPoints`)
- `PATCH/DELETE /customers/:id`, `PATCH /customers/:id/password` — chỉ admin/staff (không có `GET /:id` đơn lẻ, chỉ có `GET /` list)
- Không có self-service đổi mật khẩu — chỉ admin/staff reset hộ qua `PATCH /:id/password`
- `q` search match: `first_name`, `last_name`, `email`, `phone`
- `status`: enum `active`/`inactive`/`banned`, default `active` — chỉ sửa qua `PATCH /:id` (admin/staff)
- `loyaltyPoints`: int >= 0, chỉ sửa qua `PATCH /:id` (admin/staff), không tự thay đổi khi tạo
- Email khi tạo mới: normalize rồi check trùng (không phân biệt hoa/thường) — trùng thì `409 ConflictError`
- `passwordHash`, `failedLoginAttempts`, `lockedUntil` không lộ ra response (serializer chỉ trả `id/firstName/lastName/email/phone/address/loyaltyPoints/status/createdAt/updatedAt`)
