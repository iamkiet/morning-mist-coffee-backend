import type { SortDirection } from '../shared/pagination.ts';

export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'inactive', 'banned'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string | null;
  role?: UserRole;
}

export interface UpdateUserInput {
  role?: UserRole;
  status?: UserStatus;
}

export interface UserFilterCriteria {
  role?: UserRole;
  status?: UserStatus;
  q?: string;
}

export const USER_SORT_FIELDS = [
  'createdAt',
  'firstName',
  'lastName',
  'email',
] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export interface ListUsersFilter extends UserFilterCriteria {
  sortBy: UserSortField;
  sortDir: SortDirection;
  limit: number;
  offset: number;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
