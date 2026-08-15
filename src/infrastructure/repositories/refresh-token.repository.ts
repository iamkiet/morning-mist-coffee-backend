import { and, eq, isNull, or, lt, isNotNull } from 'drizzle-orm';
import type {
  CreateRefreshTokenInput,
  RefreshToken,
} from '../../domain/auth/refresh-token.entity.ts';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.ts';
import type { DB } from '../db/client.ts';
import { authTokens, type AuthTokenRow } from '../db/schema.ts';

function rowToRefreshToken(row: AuthTokenRow): RefreshToken {
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
      .insert(authTokens)
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
      .from(authTokens)
      .where(eq(authTokens.id, id))
      .limit(1);
    return row ? rowToRefreshToken(row) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.db
      .update(authTokens)
      .set({ revokedAt: new Date() })
      .where(eq(authTokens.id, id));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .update(authTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(authTokens.userId, userId), isNull(authTokens.revokedAt)),
      );
  }

  async deleteStale(now: Date): Promise<void> {
    await this.db
      .delete(authTokens)
      .where(or(lt(authTokens.expiresAt, now), isNotNull(authTokens.revokedAt)));
  }
}
