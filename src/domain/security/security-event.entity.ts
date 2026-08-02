export type SecurityEventType =
  | 'login_fail'
  | 'register_fail'
  | 'waf_block'
  | 'waf_suspicious'
  | 'rate_limit_hit';

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

export interface SecurityAgentAction {
  action: SecurityAgentActionType;
  reason: string;
  severity: SecuritySeverity;
  targetIp?: string;
}

export function isSecurityAgentAction(
  value: string,
): value is SecurityAgentActionType {
  return (SECURITY_AGENT_ACTIONS as readonly string[]).includes(value);
}
