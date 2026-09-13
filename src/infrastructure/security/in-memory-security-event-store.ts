import type { SecurityEventStore } from '../../domain/security/security-event-store.port.ts';
import type { SecurityEvent } from '../../domain/security/security-event.entity.ts';
import { sanitizeSecurityEvent } from '../adapters/security-event-sanitizer.ts';

const MAX_EVENTS = 2000;

export class InMemorySecurityEventStore implements SecurityEventStore {
  private events: SecurityEvent[] = [];

  // Sanitize at the write boundary, not only at the one current read site
  // (the Gemini prompt builder) — any future consumer of getRecent() must
  // not have to remember to sanitize attacker-controlled fields itself.
  record(event: SecurityEvent): void {
    this.events.push(sanitizeSecurityEvent(event));
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(-MAX_EVENTS);
    }
  }

  getRecent(sinceMs: number): SecurityEvent[] {
    const cutoff = Date.now() - sinceMs;
    this.events = this.events.filter((e) => e.occurredAt.getTime() > cutoff);
    return this.events;
  }
}
