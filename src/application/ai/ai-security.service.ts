import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { env } from '../../config/env.js';

export interface Logger {
  debug(msg: string): void;
  warn(obj: Record<string, unknown>, msg: string): void;
  error(obj: Record<string, unknown>, msg: string): void;
}

// Lớp lưu trữ tạm (Cache) để ghi nhớ các payload đã duyệt
const safePayloadCache = new Set<string>();

export class AiSecurityService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private logger: Logger) {
    // If there is no key, we instantiate but methods will early return
    const apiKey = env.GEMINI_API_KEY || 'dummy';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Phân tích payload dưới nền (Asynchronous)
   * Không block luồng chạy chính của hệ thống.
   */
  async auditPayloadAsync(
    endpoint: string,
    ip: string,
    payload: unknown,
  ): Promise<void> {
    if (!env.GEMINI_API_KEY) {
      this.logger.debug('AI Security skipped: GEMINI_API_KEY not found');
      return;
    }

    try {
      const payloadString = JSON.stringify(payload);
      
      // Tầng 2: Caching - Nếu payload y hệt đã an toàn, bỏ qua
      if (safePayloadCache.has(payloadString)) {
        return;
      }

      // Tầng 3: Gọi AI
      const prompt = `
Bạn là hệ thống bảo mật WAF (Web Application Firewall). 
Phân tích dữ liệu JSON đầu vào tại endpoint: ${endpoint} (IP: ${ip}).
Tìm các dấu hiệu tấn công như SQL Injection, XSS, Path Traversal, NoSQL Injection.
Chỉ trả về 1 từ duy nhất: "SAFE" nếu an toàn, hoặc "DANGEROUS" nếu có rủi ro.

Payload:
${payloadString}
      `;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim().toUpperCase();

      if (text.includes('DANGEROUS')) {
        // Cảnh báo đỏ cho Admin (Ghi Log Critical, Ban IP, v.v)
        this.logger.error(
          { event: 'ai_security.alert', ip, endpoint, payload },
          '🔴 HỆ THỐNG AI PHÁT HIỆN MÃ ĐỘC TẤN CÔNG!',
        );
        // Trong thực tế, gọi hàm ban IP hoặc vô hiệu hóa user tại đây.
      } else {
        // Đánh dấu an toàn vào cache (để các request giống hệt sau không cần check lại)
        if (safePayloadCache.size < 1000) {
          safePayloadCache.add(payloadString);
        }
      }
    } catch (error) {
      this.logger.warn({ err: error }, 'Lỗi khi AI phân tích payload');
    }
  }
}
