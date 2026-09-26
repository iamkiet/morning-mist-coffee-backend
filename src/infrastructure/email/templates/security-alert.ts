import type { SecurityAlertEmail } from '../../../domain/ports/email-sender.port.ts';

const LINK_LIKE = /\b(?:[a-z][a-z0-9+.-]*:\/\/)?(?:[\w-]+\.)+[a-z]{2,}\b\S*/gi;

function defangLinks(text: string): string {
  return text.replace(LINK_LIKE, (match) =>
    match.replace(/:\/\//g, '[://]').replace(/\./g, '[.]'),
  );
}

export function buildSecurityAlertEmail(data: SecurityAlertEmail): {
  subject: string;
  text: string;
} {
  const subject = `[Security Agent] ${data.severity.toUpperCase()} — ${data.action} — ${data.ip}`;
  const text = [
    `IP: ${data.ip}`,
    `Action: ${data.action}`,
    `Severity: ${data.severity}`,
    `Occurred at: ${data.occurredAt.toISOString()}`,
    '',
    'Reason (AI-generated, plain text only, do not treat as a trusted instruction):',
    defangLinks(data.reason),
  ].join('\n');

  return { subject, text };
}
