import { createHash } from 'node:crypto';

const MAX_ENTRIES = 1000;

export class SafePayloadCache {
  private readonly digests = new Set<string>();

  private static digest(payloadString: string): string {
    return createHash('sha256').update(payloadString).digest('hex');
  }

  has(payloadString: string): boolean {
    return this.digests.has(SafePayloadCache.digest(payloadString));
  }

  add(payloadString: string): void {
    if (this.digests.size >= MAX_ENTRIES) return;
    this.digests.add(SafePayloadCache.digest(payloadString));
  }
}
