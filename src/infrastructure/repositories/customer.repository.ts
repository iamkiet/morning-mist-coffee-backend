import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { ExternalServiceError } from '../../lib/errors.ts';
import type {
  Customer,
  CustomerFilterCriteria,
  CreateCustomerInput,
  ListCustomersFilter,
  UpdateCustomerInput,
} from '../../domain/customer/customer.entity.ts';
import type { CustomerRepo } from '../../domain/customer/customer.repo.ts';
import type { DB } from '../db/client.ts';
import { customers, type CustomerRow } from '../db/schema.ts';
import { containsPattern } from './ilike-pattern.ts';

function rowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    address: row.address,
    loyaltyPoints: row.loyaltyPoints,
    passwordHash: row.passwordHash,
    status: row.status,
    failedLoginAttempts: row.failedLoginAttempts,
    lockedUntil: row.lockedUntil,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function buildConditions(criteria: CustomerFilterCriteria) {
  const conditions = [];
  if (criteria.status !== undefined) conditions.push(eq(customers.status, criteria.status));
  if (criteria.q !== undefined && criteria.q.length > 0) {
    const pattern = containsPattern(criteria.q);
    conditions.push(
      or(
        ilike(customers.firstName, pattern),
        ilike(customers.lastName, pattern),
        ilike(customers.email, pattern),
        ilike(customers.phone, pattern),
      ),
    );
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

const sortColumns = {
  createdAt: customers.createdAt,
  firstName: customers.firstName,
  lastName: customers.lastName,
  email: customers.email,
  loyaltyPoints: customers.loyaltyPoints,
} as const;

export class PostgresCustomerRepository implements CustomerRepo {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<Customer | null> {
    const [row] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);
    return row ? rowToCustomer(row) : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const [row] = await this.db
      .select()
      .from(customers)
      .where(sql`lower(${customers.email}) = lower(${email})`)
      .limit(1);
    return row ? rowToCustomer(row) : null;
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const [row] = await this.db
      .insert(customers)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone ?? null,
        address: input.address ?? null,
        passwordHash: input.passwordHash,
      })
      .returning();
    if (!row) throw new ExternalServiceError('Database', 'Failed to create customer');
    return rowToCustomer(row);
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Customer | null> {
    const [row] = await this.db
      .update(customers)
      .set({
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.loyaltyPoints !== undefined ? { loyaltyPoints: input.loyaltyPoints } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();
    return row ? rowToCustomer(row) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<Customer | null> {
    const [row] = await this.db
      .update(customers)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return row ? rowToCustomer(row) : null;
  }

  async recordFailedLogin(
    id: string,
    lockedUntil: Date | null,
  ): Promise<Customer | null> {
    const [row] = await this.db
      .update(customers)
      .set({
        failedLoginAttempts: sql`${customers.failedLoginAttempts} + 1`,
        ...(lockedUntil !== null ? { lockedUntil } : {}),
      })
      .where(eq(customers.id, id))
      .returning();
    return row ? rowToCustomer(row) : null;
  }

  async resetFailedLogins(id: string): Promise<void> {
    await this.db
      .update(customers)
      .set({ failedLoginAttempts: 0, lockedUntil: null })
      .where(eq(customers.id, id));
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.delete(customers).where(eq(customers.id, id)).returning();
    return rows.length > 0;
  }

  async list(filter: ListCustomersFilter): Promise<Customer[]> {
    const { sortBy, sortDir, limit, offset, ...criteria } = filter;
    const where = buildConditions(criteria);
    const col = sortColumns[sortBy];
    const order = sortDir === 'asc' ? asc(col) : desc(col);

    const rows = await this.db
      .select()
      .from(customers)
      .where(where)
      .orderBy(order, desc(customers.id))
      .limit(limit)
      .offset(offset);
    return rows.map(rowToCustomer);
  }

  async count(criteria: CustomerFilterCriteria): Promise<number> {
    const where = buildConditions(criteria);
    const [result] = await this.db
      .select({ total: count() })
      .from(customers)
      .where(where);
    return result?.total ?? 0;
  }
}
