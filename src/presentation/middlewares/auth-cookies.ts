import type { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyReply } from 'fastify';
import { env } from '../../config/env.js';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
const REFRESH_PATH = '/api/v1/auth';

const accessCookieOpts: CookieSerializeOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  path: '/',
};

const refreshCookieOpts: CookieSerializeOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'strict',
  path: REFRESH_PATH,
};

export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
  refreshExpiresAt: Date,
): void {
  reply.setCookie(ACCESS_COOKIE, accessToken, accessCookieOpts);
  reply.setCookie(REFRESH_COOKIE, refreshToken, {
    ...refreshCookieOpts,
    expires: refreshExpiresAt,
  });
}

export function clearAuthCookies(reply: FastifyReply): void {
  reply.clearCookie(ACCESS_COOKIE, accessCookieOpts);
  reply.clearCookie(REFRESH_COOKIE, refreshCookieOpts);
}
