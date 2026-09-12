# Conventions (áp dụng mọi domain)

- ESM import kết thúc bằng `.ts`
- Throw `AppError` subclass (`src/lib/errors.ts`) — không `throw new Error`
- Đọc env qua `env` (`src/config/env.ts`) — không `process.env` trực tiếp
- `domain/` phải deterministic — không `Date.now()`, `Math.random()`, `crypto.randomUUID()`
- Không comment trong code — đặt tên rõ nghĩa thay vì giải thích
- File nên ≤ ~150 dòng — vượt thì tách
- Role dùng hằng số từ `src/domain/auth/auth-role.ts` (`ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_CUSTOMER`, `ROLES_ADMIN_STAFF`) — không hardcode string `'admin'`/`'staff'`/`'customer'`
- Trước khi implement: chạy `npm run check:arch` + `npm run typecheck` + `npm run lint` + `npm run check:dead` sau khi sửa xong
