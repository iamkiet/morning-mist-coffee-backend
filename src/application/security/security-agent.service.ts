import { env } from '../../config/env.js';
import type { EmailSender } from '../../domain/ports/email-sender.port.js';
import type { IpBlockList } from '../../domain/security/ip-block-list.port.js';
import type { SecurityDecisionPort } from '../../domain/security/security-decision.port.js';
import type { SecurityEventStore } from '../../domain/security/security-event-store.port.js';
import type { SecurityAgentAction } from '../../domain/security/security-event.entity.js';

export interface Logger {
  debug(msg: string): void;
  info(obj: Record<string, unknown>, msg: string): void;
  warn(obj: Record<string, unknown>, msg: string): void;
  error(obj: Record<string, unknown>, msg: string): void;
}

const EVENT_WINDOW_MS = 5 * 60 * 1000;
const BLOCK_TTL_MS = 5 * 60 * 1000;

const ACTION_RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_ACTIONS_PER_WINDOW = 5;

const CIRCUIT_BREAKER_BLOCK_THRESHOLD = 3;

const ALLOWED_ACTIONS = new Set(['IGNORE', 'LOG_ONLY', 'ALERT_EMAIL', 'TEMP_BLOCK_IP']);

export class SecurityAgentService {
  private executedActionTimestamps: number[] = [];

  constructor(
    private readonly eventStore: SecurityEventStore,
    private readonly ipBlockList: IpBlockList,
    private readonly decisionPort: SecurityDecisionPort,
    private readonly emailSender: EmailSender,
    private readonly logger: Logger,
  ) {}

  async runCycle(): Promise<void> {
    if (!env.SECURITY_AGENT_ENABLED) {
      this.logger.debug('Security agent disabled (SECURITY_AGENT_ENABLED=false), skipping cycle');
      return;
    }

    const events = this.eventStore.getRecent(EVENT_WINDOW_MS);
    if (events.length === 0) {
      return;
    }

    const decision = await this.decisionPort.decide(events);
    if (decision === null) {
      this.logger.warn(
        { event: 'security_agent.decision_failed', eventCount: events.length },
        'Security agent could not reach a decision this cycle (Gemini unavailable)',
      );
      return;
    }

    if (!ALLOWED_ACTIONS.has(decision.action)) {
      this.logger.error(
        { event: 'security_agent.invalid_action', decision },
        'Security agent returned an action outside the allowed list — ignoring',
      );
      return;
    }

    const finalDecision = this.applyCircuitBreaker(decision);

    this.logger.info(
      { event: 'security_agent.decision', decision: finalDecision, eventCount: events.length },
      `Security agent decided: ${finalDecision.action} (${finalDecision.severity})`,
    );

    await this.execute(finalDecision);
  }

  private applyCircuitBreaker(decision: SecurityAgentAction): SecurityAgentAction {
    if (decision.action !== 'TEMP_BLOCK_IP') {
      return decision;
    }

    const recentBlocks = this.ipBlockList.recentBlockCount(ACTION_RATE_WINDOW_MS);
    if (recentBlocks >= CIRCUIT_BREAKER_BLOCK_THRESHOLD) {
      this.logger.warn(
        { event: 'security_agent.circuit_breaker_tripped', recentBlocks },
        'Security agent circuit breaker tripped — too many TEMP_BLOCK_IP actions recently, downgrading to LOG_ONLY',
      );
      return {
        action: 'LOG_ONLY',
        reason: `Circuit breaker tripped (${recentBlocks} blocks in the last ${ACTION_RATE_WINDOW_MS / 60_000}min). Original reason: ${decision.reason}`,
        severity: decision.severity,
      };
    }

    return decision;
  }

  private isRateLimited(): boolean {
    const cutoff = Date.now() - ACTION_RATE_WINDOW_MS;
    this.executedActionTimestamps = this.executedActionTimestamps.filter((t) => t > cutoff);
    return this.executedActionTimestamps.length >= MAX_ACTIONS_PER_WINDOW;
  }

  private async execute(decision: SecurityAgentAction): Promise<void> {
    if (decision.action === 'IGNORE' || decision.action === 'LOG_ONLY') {
      return;
    }

    if (this.isRateLimited()) {
      this.logger.warn(
        { event: 'security_agent.action_rate_limited', decision },
        'Security agent action rate limit reached — skipping execution this cycle',
      );
      return;
    }

    if (decision.action === 'ALERT_EMAIL') {
      try {
        await this.emailSender.sendSecurityAlert({
          to: env.SECURITY_AGENT_ALERT_EMAIL,
          action: decision.action,
          severity: decision.severity,
          reason: decision.reason,
          occurredAt: new Date(),
        });
        this.executedActionTimestamps.push(Date.now());
      } catch (err) {
        this.logger.error({ err, event: 'security_agent.alert_email_failed' }, 'Failed to send security alert email');
      }
      return;
    }

    if (decision.action === 'TEMP_BLOCK_IP') {
      if (!decision.targetIp) {
        this.logger.warn(
          { event: 'security_agent.missing_target_ip', decision },
          'Security agent chose TEMP_BLOCK_IP without a targetIp — skipping',
        );
        return;
      }
      this.ipBlockList.block(decision.targetIp, BLOCK_TTL_MS, decision.reason);
      this.executedActionTimestamps.push(Date.now());
      this.logger.warn(
        { event: 'security_agent.ip_blocked', ip: decision.targetIp, ttlMs: BLOCK_TTL_MS },
        `Security agent temporarily blocked IP ${decision.targetIp}`,
      );
    }
  }
}
