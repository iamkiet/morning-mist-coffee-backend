export interface IpBlockList {
  isBlocked(ip: string): boolean;
  block(ip: string, ttlMs: number, reason: string): void;
  recentBlockCount(sinceMs: number): number;
}
