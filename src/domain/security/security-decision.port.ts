import type { SecurityAgentAction, SecurityEvent } from './security-event.entity.js';

export interface SecurityDecisionPort {
  decide(events: SecurityEvent[]): Promise<SecurityAgentAction | null>;
}
