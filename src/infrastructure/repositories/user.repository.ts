import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import type {
  CreateUserInput,
  ListUsersFilter,
  User,
  UserFilterCriteria,
} from '../../domain/user/user.entity.js';
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
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function buildConditions(criteria: UserFilterCriteria) {
  const conditions = [];
  if (criteria.role !== undefined) conditions.push(eq(users.role, criteria.role));
  if (criteria.status !== undefined) conditions.push(eq(users.status, criteria.status));
  if (criteria.q !== undefined && criteria.q.length > 0) {
    const pattern = `%${criteria.q}%`;
    conditions.push(
      or(
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern),
        ilike(users.email, pattern),
      ),
    );
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

const sortColumns = {
  createdAt: users.createdAt,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
} as const;

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

  async list(filter: ListUsersFilter): Promise<User[]> {
    const { sortBy, sortDir, limit, offset, ...criteria } = filter;
    const where = buildConditions(criteria);
    const col = sortColumns[sortBy];
    const order = sortDir === 'asc' ? asc(col) : desc(col);

    const rows = await this.db
      .select()
      .from(users)
      .where(where)
      .orderBy(order, desc(users.id))
      .limit(limit)
      .offset(offset);
    return rows.map(rowToUser);
  }

  async count(criteria: UserFilterCriteria): Promise<number> {
    const where = buildConditions(criteria);
    const [result] = await this.db
      .select({ total: count() })
      .from(users)
      .where(where);
    return result?.total ?? 0;
  }
}
