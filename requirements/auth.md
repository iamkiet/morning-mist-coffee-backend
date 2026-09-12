# Auth (`src/domain/auth`, `src/application/auth`)

- 2 bảng tách biệt: `employees` (admin/staff) và `customers` — không có bảng `users` chung
- Không có `POST /auth/register` — tạo customer qua `POST /customers`, tạo employee qua `POST /employees`
- 2 endpoint login riêng, không fallback chéo:
  - `POST /auth/employee-login` — chỉ query `employees`
  - `POST /auth/customer-login` — chỉ query `customers`
- 1 JWT dùng chung cho cả 2 loại account — claims: `{ sub, email, role }`, `role` là `admin | staff | customer`
- Access token: cookie httpOnly, path `/`, TTL `AUTH_ACCESS_TOKEN_TTL`
- Refresh token: cookie httpOnly, path `/api/v1/auth`, TTL `AUTH_REFRESH_TOKEN_TTL`, rotate JTI mỗi lần dùng
- `authenticate` chỉ đọc cookie `access_token` — không hỗ trợ `Authorization: Bearer`
- `requireRole(role | role[])` chạy sau `authenticate`, check `req.user.role`
- Lockout: 5 lần login sai → khoá 15 phút (`failedLoginAttempts`/`lockedUntil`)
- Account `status !== 'active'` (vd. `banned`) → login và refresh đều từ chối (`UnauthorizedError`), không tiết lộ lý do cụ thể (dùng chung message "Invalid email or password")
- CSRF double-submit: header `X-CSRF-Token` phải khớp cookie `csrf_token` (so sánh `timingSafeEqual`)
  - Exempt: GET/HEAD/OPTIONS, `POST /auth/{employee-login,customer-login,refresh,logout}`, request không có cookie `access_token`
- `GET /auth/me` trả `{ user, csrfToken }` — `csrfToken` có thể thiếu nếu không có cookie `csrf_token`
