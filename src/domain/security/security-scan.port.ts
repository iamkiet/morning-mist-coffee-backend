import type { ThreatAnalysis } from './threat-analysis.entity.ts';

export interface SecurityScanPort {
  scan(payload: string, endpoint: string, ip: string): Promise<ThreatAnalysis | null>;
}
