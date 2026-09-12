import type { SortDirection } from '../shared/pagination.ts';

export const EMPLOYEE_ROLES = ['staff', 'admin'] as const;
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];

export const EMPLOYEE_STATUSES = ['active', 'inactive', 'banned'] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  companyEmail: string;
  department: string | null;
  passwordHash: string | null;
  role: EmployeeRole;
  status: EmployeeStatus;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  companyEmail: string;
  department?: string;
  passwordHash: string | null;
  role: EmployeeRole;
}

export interface UpdateEmployeeInput {
  department?: string;
  role?: EmployeeRole;
  status?: EmployeeStatus;
}

export interface EmployeeFilterCriteria {
  role?: EmployeeRole;
  status?: EmployeeStatus;
  q?: string;
}

export const EMPLOYEE_SORT_FIELDS = [
  'createdAt',
  'firstName',
  'lastName',
  'companyEmail',
] as const;
export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];

export interface ListEmployeesFilter extends EmployeeFilterCriteria {
  sortBy: EmployeeSortField;
  sortDir: SortDirection;
  limit: number;
  offset: number;
}
