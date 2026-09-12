import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { ExternalServiceError } from '../../lib/errors.ts';
import type {
  CreateEmployeeInput,
  Employee,
  EmployeeDepartment,
  EmployeeFilterCriteria,
  ListEmployeesFilter,
  UpdateEmployeeInput,
} from '../../domain/employee/employee.entity.ts';
import type { EmployeeRepo } from '../../domain/employee/employee.repo.ts';
import type { DB } from '../db/client.ts';
import { employees, type EmployeeRow } from '../db/schema.ts';
import { containsPattern } from './ilike-pattern.ts';

function rowToEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    companyEmail: row.companyEmail,
    department: row.department as EmployeeDepartment | null,
    passwordHash: row.passwordHash,
    role: row.role,
    status: row.status,
    failedLoginAttempts: row.failedLoginAttempts,
    lockedUntil: row.lockedUntil,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function buildConditions(criteria: EmployeeFilterCriteria) {
  const conditions = [];
  if (criteria.role !== undefined) conditions.push(eq(employees.role, criteria.role));
  if (criteria.status !== undefined) conditions.push(eq(employees.status, criteria.status));
  if (criteria.q !== undefined && criteria.q.length > 0) {
    const pattern = containsPattern(criteria.q);
    conditions.push(
      or(
        ilike(employees.firstName, pattern),
        ilike(employees.lastName, pattern),
        ilike(employees.companyEmail, pattern),
        sql`${employees.role}::text ilike ${pattern}`,
      ),
    );
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

const sortColumns = {
  createdAt: employees.createdAt,
  firstName: employees.firstName,
  lastName: employees.lastName,
  companyEmail: employees.companyEmail,
} as const;

export class PostgresEmployeeRepository implements EmployeeRepo {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<Employee | null> {
    const [row] = await this.db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);
    return row ? rowToEmployee(row) : null;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    const [row] = await this.db
      .select()
      .from(employees)
      .where(sql`lower(${employees.companyEmail}) = lower(${email})`)
      .limit(1);
    return row ? rowToEmployee(row) : null;
  }

  async create(input: CreateEmployeeInput): Promise<Employee> {
    const [row] = await this.db
      .insert(employees)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        companyEmail: input.companyEmail,
        department: input.department ?? null,
        passwordHash: input.passwordHash,
        role: input.role,
      })
      .returning();
    if (!row) throw new ExternalServiceError('Database', 'Failed to create employee');
    return rowToEmployee(row);
  }

  async update(id: string, input: UpdateEmployeeInput): Promise<Employee | null> {
    const [row] = await this.db
      .update(employees)
      .set({
        ...(input.department !== undefined ? { department: input.department } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning();
    return row ? rowToEmployee(row) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<Employee | null> {
    const [row] = await this.db
      .update(employees)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return row ? rowToEmployee(row) : null;
  }

  async recordFailedLogin(
    id: string,
    lockedUntil: Date | null,
  ): Promise<Employee | null> {
    const [row] = await this.db
      .update(employees)
      .set({
        failedLoginAttempts: sql`${employees.failedLoginAttempts} + 1`,
        ...(lockedUntil !== null ? { lockedUntil } : {}),
      })
      .where(eq(employees.id, id))
      .returning();
    return row ? rowToEmployee(row) : null;
  }

  async resetFailedLogins(id: string): Promise<void> {
    await this.db
      .update(employees)
      .set({ failedLoginAttempts: 0, lockedUntil: null })
      .where(eq(employees.id, id));
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.delete(employees).where(eq(employees.id, id)).returning();
    return rows.length > 0;
  }

  async list(filter: ListEmployeesFilter): Promise<Employee[]> {
    const { sortBy, sortDir, limit, offset, ...criteria } = filter;
    const where = buildConditions(criteria);
    const col = sortColumns[sortBy];
    const order = sortDir === 'asc' ? asc(col) : desc(col);

    const rows = await this.db
      .select()
      .from(employees)
      .where(where)
      .orderBy(order, desc(employees.id))
      .limit(limit)
      .offset(offset);
    return rows.map(rowToEmployee);
  }

  async count(criteria: EmployeeFilterCriteria): Promise<number> {
    const where = buildConditions(criteria);
    const [result] = await this.db
      .select({ total: count() })
      .from(employees)
      .where(where);
    return result?.total ?? 0;
  }
}
