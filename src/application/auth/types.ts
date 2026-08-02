import type { User } from '../../domain/user/user.entity.ts';

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}
