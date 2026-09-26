import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { GetCurrentUserUseCase } from '../../application/auth/get-current-user.use-case.ts';
import type { EmployeeLoginUseCase } from '../../application/auth/employee-login.use-case.ts';
import type { CustomerLoginUseCase } from '../../application/auth/customer-login.use-case.ts';
import type { LogoutUseCase } from '../../application/auth/logout.use-case.ts';
import type { RefreshTokenUseCase } from '../../application/auth/refresh-token.use-case.ts';
import type { AuthResult } from '../../application/auth/types.ts';
import { env } from '../../config/env.ts';
import { UnauthorizedError } from '../../lib/errors.ts';
import {
  CSRF_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from '../middlewares/auth-cookies.ts';
import type { LoginBody } from '../schemas/auth.schema.ts';
import { toUserDTO } from '../serializers/auth.serializer.ts';
import { withAuthFailureLogging } from './record-auth-failure.ts';

export interface AuthUseCases {
  employeeLogin: EmployeeLoginUseCase;
  customerLogin: CustomerLoginUseCase;
  refresh: RefreshTokenUseCase;
  logout: LogoutUseCase;
  me: GetCurrentUserUseCase;
}

function toAuthPayload(result: AuthResult, csrfToken: string) {
  return {
    user: toUserDTO(result.user),
    csrfToken,
    ...(env.NODE_ENV !== 'production'
      ? { accessToken: result.accessToken, refreshToken: result.refreshToken }
      : {}),
  };
}

function resolveRefreshToken(req: FastifyRequest): string {
  const fromCookie = req.cookies[REFRESH_COOKIE];
  if (fromCookie && fromCookie.length > 0) return fromCookie;
  throw new UnauthorizedError('Missing refresh token');
}

export class AuthController {
  constructor(private readonly uc: AuthUseCases) {}

  employeeLogin = async (
    req: FastifyRequest<{ Body: z.infer<typeof LoginBody> }>,
    reply: FastifyReply,
  ) => {
    const result = await withAuthFailureLogging(
      req,
      'security_event_employee_login_fail',
      '/api/v1/auth/employee-login',
      req.body.email,
      () => this.uc.employeeLogin.execute(req.body),
    );
    const csrfToken = setAuthCookies(
      reply,
      result.accessToken,
      result.refreshToken,
      result.refreshExpiresAt,
    );
    req.log.info(
      { event: 'auth.employee_login.success', userId: result.user.id },
      'employee login success',
    );
    return reply.send(toAuthPayload(result, csrfToken));
  };

  customerLogin = async (
    req: FastifyRequest<{ Body: z.infer<typeof LoginBody> }>,
    reply: FastifyReply,
  ) => {
    const result = await withAuthFailureLogging(
      req,
      'security_event_customer_login_fail',
      '/api/v1/auth/customer-login',
      req.body.email,
      () => this.uc.customerLogin.execute(req.body),
    );
    const csrfToken = setAuthCookies(
      reply,
      result.accessToken,
      result.refreshToken,
      result.refreshExpiresAt,
    );
    req.log.info(
      { event: 'auth.customer_login.success', userId: result.user.id },
      'customer login success',
    );
    return reply.send(toAuthPayload(result, csrfToken));
  };

  refresh = async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = resolveRefreshToken(req);
    const result = await this.uc.refresh.execute({ refreshToken });
    const csrfToken = setAuthCookies(
      reply,
      result.accessToken,
      result.refreshToken,
      result.refreshExpiresAt,
    );
    return reply.send({
      csrfToken,
      ...(env.NODE_ENV !== 'production'
        ? { accessToken: result.accessToken, refreshToken: result.refreshToken }
        : {}),
    });
  };

  logout = async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = resolveRefreshToken(req);
    await this.uc.logout.execute({ refreshToken });
    clearAuthCookies(reply);
    req.log.info({ event: 'auth.logout' }, 'logout');
    return reply.code(204).send();
  };

  me = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) throw new UnauthorizedError();
    const user = await this.uc.me.execute(req.user.id, req.user.role);
    const csrfToken = req.cookies[CSRF_COOKIE];
    return reply.send({
      user: toUserDTO(user),
      ...(csrfToken ? { csrfToken } : {}),
    });
  };
}
