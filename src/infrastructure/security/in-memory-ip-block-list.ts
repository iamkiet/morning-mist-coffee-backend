import type { IpBlockList } from '../../domain/security/ip-block-list.port.js';

interface BlockEntry {
  expiresAt: number;
  reason: string;
}

export class InMemoryIpBlockList implements IpBlockList {
  private blocks = new Map<string, BlockEntry>();
  private blockTimestamps: number[] = [];

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
    this.blocks.set(ip, { expiresAt: Date.now() + ttlMs, reason });
    this.blockTimestamps.push(Date.now());
  }

  recentBlockCount(sinceMs: number): number {
    const cutoff = Date.now() - sinceMs;
    this.blockTimestamps = this.blockTimestamps.filter((t) => t > cutoff);
    return this.blockTimestamps.length;
  }
}
