import type { SecurityEvent } from './security-event.entity.js';

export interface SecurityEventStore {
  record(event: SecurityEvent): void;
  getRecent(sinceMs: number): SecurityEvent[];
}
