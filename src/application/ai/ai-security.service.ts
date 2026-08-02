import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { SecurityEventStore } from '../../domain/security/security-event-store.port.ts';
import type { SecurityScanPort } from '../../domain/security/security-scan.port.ts';
import type { ThreatAnalysis } from '../../domain/security/threat-analysis.entity.ts';
import { ForbiddenError } from '../../lib/errors.ts';
import { runHeuristicThreatCheck } from './heuristic-threat-check.ts';
import { SafePayloadCache } from './safe-payload-cache.ts';

function readEmail(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object' || !('email' in payload)) {
    return undefined;
  }
  return String((payload as Record<string, unknown>).email ?? '');
}

export class AiSecurityService {
  private readonly cache = new SafePayloadCache();

  constructor(
    private readonly scanner: SecurityScanPort | null,
    private readonly eventStore: SecurityEventStore,
    private readonly logger: AppLogger,
  ) {}

  async validatePayloadAsync(
    endpoint: string,
    ip: string,
    payload: unknown,
  ): Promise<void> {
    const payloadString = JSON.stringify(payload);
    if (this.cache.has(payloadString)) return;

    const email = readEmail(payload);
    const analysis = await this.analyze(payloadString, endpoint, ip, email);

    if (analysis.verdict === 'DANGEROUS') {
      this.reject(analysis, endpoint, ip, email, payload);
    }

    if (analysis.verdict === 'SUSPICIOUS') {
      this.flag(analysis, endpoint, ip, email, payload);
      return;
    }

    this.cache.add(payloadString);
  }

  private async analyze(
    payloadString: string,
    endpoint: string,
    ip: string,
    email: string | undefined,
  ): Promise<ThreatAnalysis> {
    if (this.scanner === null) {
      this.logFallback(endpoint, ip, 'missing_api_key', 'GEMINI_API_KEY not configured');
      return runHeuristicThreatCheck(payloadString, email);
    }

    const scanned = await this.scanner.scan(payloadString, endpoint, ip);
    if (scanned !== null) return scanned;

    this.logFallback(endpoint, ip, 'gemini_call_failed', 'Gemini call failed');
    return runHeuristicThreatCheck(payloadString, email);
  }

  private logFallback(
    endpoint: string,
    ip: string,
    reason: string,
    detail: string,
  ): void {
    this.logger.warn(
      { event: 'ai_security.fallback', ip, endpoint, reason },
      `AI Security WAF running on heuristic fallback: ${detail}`,
    );
  }

  private reject(
    analysis: ThreatAnalysis,
    endpoint: string,
    ip: string,
    email: string | undefined,
    payload: unknown,
  ): never {
    this.logger.error(
      { event: 'ai_security.alert', ip, endpoint, analysis, payload },
      `AI system detected a malicious attack. Type: ${analysis.threatType}, Reason: ${analysis.reason}`,
    );
    this.eventStore.record({
      type: 'waf_block',
      ip,
      endpoint,
      email,
      occurredAt: new Date(),
      detail: `${analysis.threatType}: ${analysis.reason}`,
    });
    throw new ForbiddenError(
      `Request blocked by AI Security WAF. Reason: ${analysis.reason}`,
    );
  }

  private flag(
    analysis: ThreatAnalysis,
    endpoint: string,
    ip: string,
    email: string | undefined,
    payload: unknown,
  ): void {
    this.logger.warn(
      { event: 'ai_security.suspicious', ip, endpoint, analysis, payload },
      `AI system detected suspicious activity. Type: ${analysis.threatType}, Reason: ${analysis.reason}`,
    );
    this.eventStore.record({
      type: 'waf_suspicious',
      ip,
      endpoint,
      email,
      occurredAt: new Date(),
      detail: `${analysis.threatType}: ${analysis.reason}`,
    });
  }
}
