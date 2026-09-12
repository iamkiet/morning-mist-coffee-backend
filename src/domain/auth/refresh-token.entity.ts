import type { AccountType } from './auth-role.ts';

export interface RefreshToken {
  id: string;
  userId: string;
  accountType: AccountType;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface CreateRefreshTokenInput {
  id: string;
  userId: string;
  accountType: AccountType;
  expiresAt: Date;
}
