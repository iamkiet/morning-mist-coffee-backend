import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { GetCurrentUserUseCase } from '../../application/auth/get-current-user.use-case.ts';
import type { LoginUserUseCase } from '../../application/auth/login-user.use-case.ts';
import type { LogoutUseCase } from '../../application/auth/logout.use-case.ts';
import type { RefreshTokenUseCase } from '../../application/auth/refresh-token.use-case.ts';
import type { RegisterUserUseCase } from '../../application/auth/register-user.use-case.ts';
import type { AuthResult } from '../../application/auth/types.ts';
import { UnauthorizedError } from '../../lib/errors.ts';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from '../middlewares/auth-cookies.ts';
import type {
  LoginBody,
  RefreshBody,
  RegisterBody,
} from '../schemas/auth.schema.ts';
import { toUserDTO } from '../serializers/auth.serializer.ts';
import { withAuthFailureLogging } from './record-auth-failure.ts';

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

function resolveRefreshToken(
  req: FastifyRequest<{ Body: z.infer<typeof RefreshBody> }>,
): string {
  const fromBody = req.body?.refreshToken;
  if (fromBody && fromBody.length > 0) return fromBody;
  const fromCookie = req.cookies[REFRESH_COOKIE];
  if (fromCookie && fromCookie.length > 0) return fromCookie;
  throw new UnauthorizedError('Missing refresh token');
}


export class AuthController {
  constructor(
    private readonly uc: AuthUseCases,
  ) {}

  register = async (
    req: FastifyRequest<{ Body: z.infer<typeof RegisterBody> }>,
    reply: FastifyReply,
  ) => {
    const result = await withAuthFailureLogging(
      req,
      'register_fail',
      '/api/v1/auth/register',
      req.body.email,
      () => this.uc.register.execute(req.body),
    );
    setAuthCookies(
      reply,
      result.accessToken,
      result.refreshToken,
      result.refreshExpiresAt,
    );
    req.log.info(
      { event: 'auth.register.success', userId: result.user.id },
      'register success',
    );
    return reply.code(201).send(toAuthPayload(result));
  };

  login = async (
    req: FastifyRequest<{ Body: z.infer<typeof LoginBody> }>,
    reply: FastifyReply,
  ) => {
    const result = await withAuthFailureLogging(
      req,
      'login_fail',
      '/api/v1/auth/login',
      req.body.email,
      () => this.uc.login.execute(req.body),
    );
    setAuthCookies(
      reply,
      result.accessToken,
      result.refreshToken,
      result.refreshExpiresAt,
    );
    req.log.info(
      { event: 'auth.login.success', userId: result.user.id },
      'login success',
    );
    return reply.send(toAuthPayload(result));
  };

  refresh = async (
    req: FastifyRequest<{ Body: z.infer<typeof RefreshBody> }>,
    reply: FastifyReply,
  ) => {
    const refreshToken = resolveRefreshToken(req);
    const result = await this.uc.refresh.execute({ refreshToken });
    setAuthCookies(
      reply,
      result.accessToken,
      result.refreshToken,
      result.refreshExpiresAt,
    );
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
