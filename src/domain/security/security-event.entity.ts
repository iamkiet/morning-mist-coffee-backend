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

export type SecurityAgentActionType =
  | 'IGNORE'
  | 'LOG_ONLY'
  | 'ALERT_EMAIL'
  | 'TEMP_BLOCK_IP';

export interface SecurityAgentAction {
  action: SecurityAgentActionType;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  targetIp?: string;
}
