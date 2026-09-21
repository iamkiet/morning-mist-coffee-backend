# Employee (`src/domain/employee`, `src/application/employee`)

- CRUD employee — chỉ admin/staff (`ROLES_ADMIN_STAFF`), staff có full quyền như admin TRỪ:
  - không được set role `admin` khi tạo/sửa employee khác (`create`/`update`)
  - không được xoá account có role `admin` (`delete`)
  - không được tự xoá chính mình (áp dụng cho mọi role, không riêng staff)
- Staff KHÔNG bị giới hạn "chỉ sửa được chính mình" — được sửa/đổi password/xoá employee khác (miễn không đụng vào role/account `admin`). Đừng thêm lại rule này trừ khi có yêu cầu rõ ràng — đã cố ý bỏ để nhất quán giữa create/update/password/delete
- Check role dùng `ROLE_ADMIN`/`ROLE_STAFF` từ `domain/auth/auth-role.ts`, dùng `EMPLOYEE_ROLE_ADMIN` từ `domain/employee/employee.entity.ts` khi gán giá trị `EmployeeRole` (2 type khác nhau, không lẫn)
- `q` search match: `first_name`, `last_name`, `company_email`, `role`
- `POST /` (create) cần thêm header `x-employee-registration-key` đúng `env.EMPLOYEE_REGISTRATION_KEY` (`checkEmployeeRegistrationKey` preHandler, timing-safe compare) — ngoài check role admin/staff
- `companyEmail` unique, normalize (lowercase) trước khi so sánh/lưu (`resolveNewAccountEmail`) — trùng thì `ConflictError`
- `department` optional, enum cố định (`EMPLOYEE_DEPARTMENTS` trong `employee.entity.ts`), nullable
- `PATCH /:id` (update) chỉ đổi được `department`/`role`/`status` — không đổi `firstName`/`lastName`/`companyEmail`; body phải có ít nhất 1 field
- Đổi password là endpoint riêng `PATCH /:id/password`, không qua `update`
- `EmployeeSchema` (response) không bao giờ trả `passwordHash`, `failedLoginAttempts`, `lockedUntil` — serializer set field cứng
