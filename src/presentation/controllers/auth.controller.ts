import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { GetCurrentUserUseCase } from '../../application/auth/get-current-user.use-case.js';
import type { LoginUserUseCase } from '../../application/auth/login-user.use-case.js';
import type { LogoutUseCase } from '../../application/auth/logout.use-case.js';
import type { RefreshTokenUseCase } from '../../application/auth/refresh-token.use-case.js';
import type { RegisterUserUseCase } from '../../application/auth/register-user.use-case.js';
import type { AuthResult } from '../../application/auth/types.js';
import { UnauthorizedError } from '../../lib/errors.js';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from '../middlewares/auth-cookies.js';
import type { LoginBody, RefreshBody, RegisterBody } from '../schemas/auth.schema.js';
import { toUserDTO } from '../serializers/auth.serializer.js';

export interface AuthUseCases {
  register: RegisterUserUseCase;
  login: LoginUserUseCase;
  refresh: RefreshTokenUseCase;
  logout: LogoutUseCase;
  me: GetCurrentUserUseCase;
}

function toAuthPayload(result: AuthResult) {
  return {
    user: toUserDTO(result.user),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  };
}

function resolveRefreshToken(req: FastifyRequest<{ Body: z.infer<typeof RefreshBody> }>): string {
  const fromBody = req.body?.refreshToken;
  if (fromBody && fromBody.length > 0) return fromBody;
  const fromCookie = req.cookies[REFRESH_COOKIE];
  if (fromCookie && fromCookie.length > 0) return fromCookie;
  throw new UnauthorizedError('Missing refresh token');
}

export class AuthController {
  constructor(private readonly uc: AuthUseCases) {}

  register = async (
    req: FastifyRequest<{ Body: z.infer<typeof RegisterBody> }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.uc.register.execute(req.body);
      setAuthCookies(reply, result.accessToken, result.refreshToken, result.refreshExpiresAt);
      req.log.info(
        { event: 'auth.register.success', userId: result.user.id },
        'register success',
      );
      return reply.code(201).send(toAuthPayload(result));
    } catch (err) {
      req.log.warn({ event: 'auth.register.failed', email: req.body.email }, 'register failed');
      throw err;
    }
  };

  login = async (
    req: FastifyRequest<{ Body: z.infer<typeof LoginBody> }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.uc.login.execute(req.body);
      setAuthCookies(reply, result.accessToken, result.refreshToken, result.refreshExpiresAt);
      req.log.info(
        { event: 'auth.login.success', userId: result.user.id },
        'login success',
      );
      return reply.send(toAuthPayload(result));
    } catch (err) {
      req.log.warn({ event: 'auth.login.failed', email: req.body.email }, 'login failed');
      throw err;
    }
  };

  refresh = async (
    req: FastifyRequest<{ Body: z.infer<typeof RefreshBody> }>,
    reply: FastifyReply,
  ) => {
    const refreshToken = resolveRefreshToken(req);
    const result = await this.uc.refresh.execute({ refreshToken });
    setAuthCookies(reply, result.accessToken, result.refreshToken, result.refreshExpiresAt);
    return reply.send({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  };

  logout = async (
    req: FastifyRequest<{ Body: z.infer<typeof RefreshBody> }>,
    reply: FastifyReply,
  ) => {
    const refreshToken = resolveRefreshToken(req);
    await this.uc.logout.execute({ refreshToken });
    clearAuthCookies(reply);
    req.log.info({ event: 'auth.logout' }, 'logout');
    return reply.code(204).send();
  };

  me = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) throw new UnauthorizedError();
    const user = await this.uc.me.execute(req.user.id);
    return reply.send(toUserDTO(user));
  };
}
