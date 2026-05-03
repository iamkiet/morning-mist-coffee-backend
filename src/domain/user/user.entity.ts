export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string | null;
  role: UserRole;
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

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
