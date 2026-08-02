import type { SecurityAgentAction, SecurityEvent } from './security-event.entity.ts';

export interface SecurityDecisionPort {
  decide(events: SecurityEvent[]): Promise<SecurityAgentAction | null>;
}
