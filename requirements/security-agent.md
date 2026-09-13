# Security Agent (`src/domain/security`, `src/application/security`)

- Chạy mỗi 60s, đọc security event 5 phút gần nhất (`SecurityEventStore`)
- Gemini quyết định action: `IGNORE | LOG_ONLY | ALERT_EMAIL | TEMP_BLOCK_IP` (structured output)
- Allow-list action cố định (`isSecurityAgentAction()`) — reject action lạ
- Rate-limit action thật (`ALERT_EMAIL`/`TEMP_BLOCK_IP`): tối đa 5 lần / 10 phút
- Event store + IP block list: có TTL/expiry, cap size — không tồn tại vĩnh viễn
- Circuit breaker: > 3 lần `TEMP_BLOCK_IP` trong 10 phút → tự hạ xuống `LOG_ONLY`
- Email cảnh báo: `reason` do Gemini sinh chỉ render plain text — KHÔNG HTML/link
- Kill switch: `SECURITY_AGENT_ENABLED=false` → chỉ log, không tự hành động
- `TEMP_BLOCK_IP`: chặn 5 phút qua `IpBlockList` (in-memory), check ở `onRequest` hook toàn app (trừ `/health`)
- Input sự kiện coi là không tin cậy: sanitize (strip non-printable + `{}<>\``, truncate 300 ký tự) ngay tại điểm ghi vào event store (không phải lúc build prompt) — mọi consumer đọc `getRecent()` sau này đều nhận dữ liệu đã sạch, không cần tự nhớ sanitize + bọc tag `<events>` trước khi đưa vào prompt
