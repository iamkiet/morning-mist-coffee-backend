import type { IpBlockList } from '../../domain/security/ip-block-list.port.ts';

const MAX_BLOCKS = 1000;

interface BlockEntry {
  expiresAt: number;
  reason: string;
}

export class InMemoryIpBlockList implements IpBlockList {
  private blocks = new Map<string, BlockEntry>();

  isBlocked(ip: string): boolean {
    const entry = this.blocks.get(ip);
    if (!entry) return false;
    if (entry.expiresAt <= Date.now()) {
      this.blocks.delete(ip);
      return false;
    }
    return true;
  }

  block(ip: string, ttlMs: number, reason: string): void {
    const now = Date.now();
    this.blocks.delete(ip);
    for (const [key, entry] of this.blocks) {
      if (entry.expiresAt <= now) this.blocks.delete(key);
    }
    while (this.blocks.size >= MAX_BLOCKS) {
      const oldest = this.blocks.keys().next().value;
      if (oldest === undefined) break;
      this.blocks.delete(oldest);
    }
    this.blocks.set(ip, { expiresAt: now + ttlMs, reason });
  }

}
