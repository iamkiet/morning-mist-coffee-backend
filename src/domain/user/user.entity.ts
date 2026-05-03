export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'banned';

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

export interface UserFilterCriteria {
  role?: UserRole;
  status?: UserStatus;
  q?: string;
}

export interface ListUsersFilter extends UserFilterCriteria {
  sortBy: 'createdAt' | 'firstName' | 'lastName' | 'email';
  sortDir: 'asc' | 'desc';
  limit: number;
  offset: number;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
