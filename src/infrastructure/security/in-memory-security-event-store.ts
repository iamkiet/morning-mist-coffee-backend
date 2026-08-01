import type { SecurityEventStore } from '../../domain/security/security-event-store.port.js';
import type { SecurityEvent } from '../../domain/security/security-event.entity.js';

const MAX_EVENTS = 2000;

export class InMemorySecurityEventStore implements SecurityEventStore {
  private events: SecurityEvent[] = [];

  record(event: SecurityEvent): void {
    this.events.push(event);
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
