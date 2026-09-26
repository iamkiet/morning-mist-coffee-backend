import type { SecurityEvent } from './security-event.entity.ts';

export interface SecurityEventStore {
  record(event: SecurityEvent): void;
  getAll(): SecurityEvent[];
  removeUntil(cutoff: Date): void;
}
