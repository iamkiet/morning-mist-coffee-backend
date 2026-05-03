import type { CreateRefreshTokenInput, RefreshToken } from './refresh-token.entity.js';

export interface RefreshTokenRepo {
  create(input: CreateRefreshTokenInput): Promise<RefreshToken>;
  findById(id: string): Promise<RefreshToken | null>;
  revoke(id: string): Promise<void>;
}
