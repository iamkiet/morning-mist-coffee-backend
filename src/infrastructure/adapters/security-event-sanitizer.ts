import type { SecurityEvent } from '../../domain/security/security-event.entity.ts';

const MAX_FIELD_LENGTH = 300;
const TEMPLATE_CHARS = /[{}<>`]/g;

function isPrintableAscii(charCode: number): boolean {
  return charCode >= 32 && charCode !== 127;
}

function sanitize(value: string | undefined): string | undefined {
  if (!value) return value;
  const printable = Array.from(value)
    .filter((char) => isPrintableAscii(char.charCodeAt(0)))
    .join('');
  return printable.slice(0, MAX_FIELD_LENGTH).replace(TEMPLATE_CHARS, '');
}

export function sanitizeSecurityEvent(event: SecurityEvent): SecurityEvent {
  return {
    ...event,
    userAgent: sanitize(event.userAgent),
    email: sanitize(event.email),
    detail: sanitize(event.detail),
  };
}
