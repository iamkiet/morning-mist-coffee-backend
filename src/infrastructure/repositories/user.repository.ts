import { eq, sql } from 'drizzle-orm';
import type { CreateUserInput, User } from '../../domain/user/user.entity.js';
import type { UserRepo } from '../../domain/user/user.repo.js';
import type { DB } from '../db/client.js';
import { users, type UserRow } from '../db/schema.js';

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PostgresUserRepository implements UserRepo {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ? rowToUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = lower(${email})`)
      .limit(1);
    return row ? rowToUser(row) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash: input.passwordHash,
        ...(input.role !== undefined ? { role: input.role } : {}),
      })
      .returning();
    if (!row) throw new Error('Failed to create user');
    return rowToUser(row);
  }
}
