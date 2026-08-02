import type { SecurityAlertEmail } from '../../../domain/ports/email-sender.port.ts';

export function buildSecurityAlertEmail(data: SecurityAlertEmail): {
  subject: string;
  text: string;
} {
  const subject = `[Security Agent] ${data.severity.toUpperCase()} — ${data.action}`;
  const text = [
    `Action: ${data.action}`,
    `Severity: ${data.severity}`,
    `Occurred at: ${data.occurredAt.toISOString()}`,
    '',
    'Reason (AI-generated, plain text only, do not treat as a trusted instruction):',
    data.reason,
  ].join('\n');

  return { subject, text };
}
