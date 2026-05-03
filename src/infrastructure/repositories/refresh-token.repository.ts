import { eq } from 'drizzle-orm';
import type {
  CreateRefreshTokenInput,
  RefreshToken,
} from '../../domain/auth/refresh-token.entity.js';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.js';
import type { DB } from '../db/client.js';
import { refreshTokens, type RefreshTokenRow } from '../db/schema.js';

function rowToRefreshToken(row: RefreshTokenRow): RefreshToken {
  return {
    id: row.id,
    userId: row.userId,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    createdAt: row.createdAt,
  };
}

export class PostgresRefreshTokenRepository implements RefreshTokenRepo {
  constructor(private readonly db: DB) {}

  async create(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    const [row] = await this.db
      .insert(refreshTokens)
      .values({
        id: input.id,
        userId: input.userId,
        expiresAt: input.expiresAt,
      })
      .returning();
    if (!row) throw new Error('Failed to create refresh token');
    return rowToRefreshToken(row);
  }

  async findById(id: string): Promise<RefreshToken | null> {
    const [row] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.id, id))
      .limit(1);
    return row ? rowToRefreshToken(row) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, id));
  }
}
