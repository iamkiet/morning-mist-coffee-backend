import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { EmailSender } from '../../domain/ports/email-sender.port.ts';
import type { IpBlockList } from '../../domain/security/ip-block-list.port.ts';
import type { SecurityDecisionPort } from '../../domain/security/security-decision.port.ts';
import type { SecurityEventStore } from '../../domain/security/security-event-store.port.ts';
import {
  groupSecurityEventsByIp,
  isSecurityAgentAction,
  type SecurityAgentDecision,
} from '../../domain/security/security-event.entity.ts';

export interface SecurityAgentConfig {
  enabled: boolean;
  alertEmail: string;
}

const BLOCK_TTL_MS = 5 * 60 * 1000;

const ACTION_RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_ACTIONS_PER_WINDOW = 5;

export class SecurityAgentService {
  private executedActionTimestamps: number[] = [];

  constructor(
    private readonly eventStore: SecurityEventStore,
    private readonly ipBlockList: IpBlockList,
    private readonly decisionPort: SecurityDecisionPort,
    private readonly emailSender: EmailSender,
    private readonly config: SecurityAgentConfig,
    private readonly logger: AppLogger,
  ) {}

  async runCycle(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.debug(
        'Security agent disabled (SECURITY_AGENT_ENABLED=false), skipping cycle',
      );
      return;
    }

    const readAt = new Date();
    const ipEvents = groupSecurityEventsByIp(this.eventStore.getAll());
    if (ipEvents.length === 0) {
      return;
    }

    const decisions = await this.decisionPort.decide(ipEvents);
    if (decisions === null) {
      this.logger.warn(
        { event: 'security_agent.decision_failed', ipCount: ipEvents.length },
        'Security agent could not reach a decision this cycle (Gemini unavailable)',
      );
      return;
    }

    this.eventStore.removeUntil(readAt);

    const knownIps = new Set(ipEvents.map((g) => g.ip));
    const handledIps = new Set<string>();
    for (const decision of decisions) {
      if (!isSecurityAgentAction(decision.action)) {
        this.logger.error(
          { event: 'security_agent.invalid_action', decision },
          'Security agent returned an action outside the allowed list — ignoring',
        );
        continue;
      }
      if (!knownIps.has(decision.ip) || handledIps.has(decision.ip)) {
        this.logger.error(
          { event: 'security_agent.unknown_target_ip', decision },
          'Security agent returned an IP that is not in this cycle or was already handled — ignoring',
        );
        continue;
      }
      handledIps.add(decision.ip);

      this.logger.info(
        { event: 'security_agent.decision', decision },
        `Security agent decided: ${decision.action} (${decision.severity}) for ${decision.ip}`,
      );
      await this.execute(decision);
    }
  }

  private isRateLimited(): boolean {
    const cutoff = Date.now() - ACTION_RATE_WINDOW_MS;
    this.executedActionTimestamps = this.executedActionTimestamps.filter(
      (t) => t > cutoff,
    );
    return this.executedActionTimestamps.length >= MAX_ACTIONS_PER_WINDOW;
  }

  private async execute(decision: SecurityAgentDecision): Promise<void> {
    if (decision.action === 'IGNORE' || decision.action === 'LOG_ONLY') {
      return;
    }

    if (this.isRateLimited()) {
      this.logger.warn(
        { event: 'security_agent.action_rate_limited', decision },
        'Security agent action rate limit reached — skipping this action',
      );
      return;
    }

    if (decision.action === 'ALERT_EMAIL') {
      await this.sendAlert(decision);
      return;
    }

    this.blockIp(decision);
  }

  private async sendAlert(decision: SecurityAgentDecision): Promise<void> {
    try {
      await this.emailSender.sendSecurityAlert({
        to: this.config.alertEmail,
        ip: decision.ip,
        action: decision.action,
        severity: decision.severity,
        reason: decision.reason,
        occurredAt: new Date(),
      });
      this.executedActionTimestamps.push(Date.now());
    } catch (err) {
      this.logger.error(
        { err, event: 'security_agent.alert_email_failed' },
        'Failed to send security alert email',
      );
    }
  }

  private blockIp(decision: SecurityAgentDecision): void {
    this.ipBlockList.block(decision.ip, BLOCK_TTL_MS, decision.reason);
    this.executedActionTimestamps.push(Date.now());
    this.logger.warn(
      { event: 'security_agent.ip_blocked', ip: decision.ip, ttlMs: BLOCK_TTL_MS },
      `Security agent temporarily blocked IP ${decision.ip}`,
    );
  }
}
