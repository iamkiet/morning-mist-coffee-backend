import type { ThreatAnalysis } from '../../domain/security/threat-analysis.entity.ts';

const SQLI_PATTERN =
  /(\bunion\b\s+\bselect\b)|(\bor\b\s+['"]?1['"]?\s*=\s*['"]?1)|(;\s*drop\s+table\b)|(--\s*$)|(\bxp_cmdshell\b)|(\bsleep\s*\()/i;
const XSS_PATTERN =
  /<script[\s>]|javascript:|on(error|load|click|mouseover)\s*=|<iframe[\s>]/i;
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'throwawaymail.com',
  'yopmail.com',
];

export function runHeuristicThreatCheck(
  payloadString: string,
  email: string | undefined,
): ThreatAnalysis {
  if (SQLI_PATTERN.test(payloadString)) {
    return {
      verdict: 'DANGEROUS',
      threatType: 'SQL_INJECTION',
      confidence: 0.6,
      reason: 'Heuristic fallback matched a SQL injection signature',
    };
  }

  if (XSS_PATTERN.test(payloadString)) {
    return {
      verdict: 'DANGEROUS',
      threatType: 'XSS',
      confidence: 0.6,
      reason: 'Heuristic fallback matched an XSS signature',
    };
  }

  const normalized = email?.toLowerCase();
  if (
    normalized &&
    DISPOSABLE_EMAIL_DOMAINS.some((domain) => normalized.endsWith(`@${domain}`))
  ) {
    return {
      verdict: 'DANGEROUS',
      threatType: 'BOT_SIGNATURE',
      confidence: 0.5,
      reason: 'Heuristic fallback matched a disposable email domain',
    };
  }

  return {
    verdict: 'SAFE',
    threatType: 'NONE',
    confidence: 0,
    reason: 'Heuristic fallback found no known attack signature',
  };
}
