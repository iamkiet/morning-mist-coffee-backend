import type { AuthRole } from '../auth/auth-role.ts';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: AuthRole;
}

export interface RefreshTokenClaims {
  sub: string;
  jti: string;
}

export interface IssuedRefreshToken {
  token: string;
  jti: string;
  expiresAt: Date;
}

export interface TokenSigner {
  signAccess(claims: AccessTokenClaims): Promise<string>;
  signRefresh(sub: string): Promise<IssuedRefreshToken>;
  verifyAccess(token: string): Promise<AccessTokenClaims>;
  verifyRefresh(token: string): Promise<RefreshTokenClaims>;
}
