import type { User } from '../../domain/user/user.entity.js';

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}
