import type { AuthRole } from '../../domain/auth/auth-role.ts';

export interface AuthAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AuthRole;
  status: 'active' | 'inactive' | 'banned';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: AuthAccount;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}
