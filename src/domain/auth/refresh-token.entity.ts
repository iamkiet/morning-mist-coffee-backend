export interface RefreshToken {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface CreateRefreshTokenInput {
  id: string;
  userId: string;
  expiresAt: Date;
}
