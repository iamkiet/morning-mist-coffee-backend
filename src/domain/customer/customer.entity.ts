import type { SortDirection } from '../shared/pagination.ts';

export const CUSTOMER_STATUSES = ['active', 'inactive', 'banned'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  loyaltyPoints: number;
  passwordHash: string | null;
  status: CustomerStatus;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  passwordHash: string | null;
}

export interface UpdateCustomerInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  loyaltyPoints?: number;
  status?: CustomerStatus;
}

export interface CustomerFilterCriteria {
  status?: CustomerStatus;
  q?: string;
}

export const CUSTOMER_SORT_FIELDS = [
  'createdAt',
  'firstName',
  'lastName',
  'email',
  'loyaltyPoints',
] as const;
export type CustomerSortField = (typeof CUSTOMER_SORT_FIELDS)[number];

export interface ListCustomersFilter extends CustomerFilterCriteria {
  sortBy: CustomerSortField;
  sortDir: SortDirection;
  limit: number;
  offset: number;
}
