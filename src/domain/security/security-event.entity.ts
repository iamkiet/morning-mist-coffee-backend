export type SecurityEventType =
  | 'security_event_customer_login_fail'
  | 'security_event_employee_login_fail'
  | 'security_event_rate_limit_hit';

export interface SecurityEvent {
  type: SecurityEventType;
  ip: string;
  occurredAt: Date;
  endpoint?: string;
  email?: string;
  userAgent?: string;
  detail?: string;
}

export const SECURITY_AGENT_ACTIONS = [
  'IGNORE',
  'LOG_ONLY',
  'ALERT_EMAIL',
  'TEMP_BLOCK_IP',
] as const;
export type SecurityAgentActionType = (typeof SECURITY_AGENT_ACTIONS)[number];

export const SECURITY_SEVERITIES = ['low', 'medium', 'high'] as const;
export type SecuritySeverity = (typeof SECURITY_SEVERITIES)[number];

export interface SecurityAgentDecision {
  ip: string;
  action: SecurityAgentActionType;
  severity: SecuritySeverity;
  reason: string;
}

export interface SecurityIpEvents {
  ip: string;
  counts: Record<SecurityEventType, number>;
  events: SecurityEvent[];
}

export function groupSecurityEventsByIp(events: SecurityEvent[]): SecurityIpEvents[] {
  const groups = new Map<string, SecurityIpEvents>();
  for (const event of events) {
    let group = groups.get(event.ip);
    if (!group) {
      group = {
        ip: event.ip,
        counts: {
          security_event_customer_login_fail: 0,
          security_event_employee_login_fail: 0,
          security_event_rate_limit_hit: 0,
        },
        events: [],
      };
      groups.set(event.ip, group);
    }
    group.counts[event.type]++;
    group.events.push(event);
  }
  return [...groups.values()];
}

export function isSecurityAgentAction(
  value: string,
): value is SecurityAgentActionType {
  return (SECURITY_AGENT_ACTIONS as readonly string[]).includes(value);
}
