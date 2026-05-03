import { SignJWT, jwtVerify } from 'jose';
import { UnauthorizedError } from '../../lib/errors.js';
import type {
  AccessTokenClaims,
  IssuedRefreshToken,
  RefreshTokenClaims,
  TokenSigner,
} from '../../domain/ports/token-signer.port.js';
import type { UserRole } from '../../domain/user/user.entity.js';

const ISSUER = 'backend';
const ACCESS_TYPE = 'access';
const REFRESH_TYPE = 'refresh';
const ROLES: readonly UserRole[] = ['user', 'admin'];

function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' && (ROLES as readonly string[]).includes(value)
  );
}

export class JoseTokenSigner implements TokenSigner {
  private readonly key: Uint8Array;

  constructor(
    secret: string,
    private readonly accessTtl: string,
    private readonly refreshTtl: string,
  ) {
    this.key = new TextEncoder().encode(secret);
  }

  async signAccess(claims: AccessTokenClaims): Promise<string> {
    return new SignJWT({
      email: claims.email,
      role: claims.role,
      type: ACCESS_TYPE,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(claims.sub)
      .setIssuer(ISSUER)
      .setIssuedAt()
      .setExpirationTime(this.accessTtl)
      .sign(this.key);
  }

  async signRefresh(sub: string): Promise<IssuedRefreshToken> {
    const jti = crypto.randomUUID();
    const token = await new SignJWT({ type: REFRESH_TYPE })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(sub)
      .setJti(jti)
      .setIssuer(ISSUER)
      .setIssuedAt()
      .setExpirationTime(this.refreshTtl)
      .sign(this.key);

    const { payload } = await jwtVerify(token, this.key, { issuer: ISSUER });
    if (typeof payload.exp !== 'number') {
      throw new Error('Failed to read refresh token expiry');
    }
    return { token, jti, expiresAt: new Date(payload.exp * 1000) };
  }

  async verifyAccess(token: string): Promise<AccessTokenClaims> {
    try {
      const { payload } = await jwtVerify(token, this.key, { issuer: ISSUER });
      if (
        payload.type !== ACCESS_TYPE ||
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string' ||
        !isUserRole(payload.role)
      ) {
        throw new UnauthorizedError('Invalid token payload');
      }
      return { sub: payload.sub, email: payload.email, role: payload.role };
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  async verifyRefresh(token: string): Promise<RefreshTokenClaims> {
    try {
      const { payload } = await jwtVerify(token, this.key, { issuer: ISSUER });
      if (
        payload.type !== REFRESH_TYPE ||
        typeof payload.sub !== 'string' ||
        typeof payload.jti !== 'string'
      ) {
        throw new UnauthorizedError('Invalid refresh token payload');
      }
      return { sub: payload.sub, jti: payload.jti };
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }
}
