export const THREAT_VERDICTS = ['SAFE', 'SUSPICIOUS', 'DANGEROUS'] as const;
export type ThreatVerdict = (typeof THREAT_VERDICTS)[number];

export const THREAT_TYPES = [
  'SQL_INJECTION',
  'XSS',
  'PROMPT_INJECTION',
  'BOT_SIGNATURE',
  'NONE',
] as const;
export type ThreatType = (typeof THREAT_TYPES)[number];

export interface ThreatAnalysis {
  verdict: ThreatVerdict;
  threatType: ThreatType;
  confidence: number;
  reason: string;
}
