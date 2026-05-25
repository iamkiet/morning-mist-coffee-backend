import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { env } from '../../config/env.js';

export interface Logger {
  debug(msg: string): void;
  warn(obj: Record<string, unknown>, msg: string): void;
  error(obj: Record<string, unknown>, msg: string): void;
}

// Temporary storage (Cache) to remember audited safe payloads
const safePayloadCache = new Set<string>();

export class AiSecurityService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private logger: Logger) {
    // If there is no key, we instantiate but methods will early return
    const apiKey = env.GEMINI_API_KEY || 'dummy';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  }

  /**
   * Audit payload asynchronously in the background.
   * Does not block the main application execution thread.
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
      
      // Phase 2: Caching - Skip if identical payload is already verified as safe
      if (safePayloadCache.has(payloadString)) {
        return;
      }

      // Phase 3: Query AI
      const prompt = `
You are a WAF (Web Application Firewall) security system.
Analyze the input JSON data at endpoint: ${endpoint} (IP: ${ip}).
Look for attack signatures such as SQL Injection, XSS, Path Traversal, NoSQL Injection.
Return ONLY one of the following words: "SAFE" if it is safe, or "DANGEROUS" if there is a risk.

Payload:
${payloadString}
      `;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim().toUpperCase();

      if (text.includes('DANGEROUS')) {
        // Red alert for Admin (Critical log, IP ban, etc.)
        this.logger.error(
          { event: 'ai_security.alert', ip, endpoint, payload },
          '🔴 AI SYSTEM DETECTED A MALICIOUS ATTACK!',
        );
        // In production, call IP ban or disable user account functions here.
      } else {
        // Mark as safe in cache (so identical subsequent requests won't need recheck)
        if (safePayloadCache.size < 1000) {
          safePayloadCache.add(payloadString);
        }
      }
    } catch (error) {
      this.logger.warn({ err: error }, 'Error when AI analyzed payload');
    }
  }
}
