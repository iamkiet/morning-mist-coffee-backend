import type { SecurityAgentDecision, SecurityIpEvents } from './security-event.entity.ts';

export interface SecurityDecisionPort {
  decide(ipEvents: SecurityIpEvents[]): Promise<SecurityAgentDecision[] | null>;
}
