import type { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyReply } from 'fastify';
import { env } from '../../config/env.ts';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
const REFRESH_PATH = '/api/v1/auth';

function parseTtlSeconds(ttl: string): number {
  const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
  const match = /^(\d+)([smhdw])$/.exec(ttl);
  if (!match) throw new Error(`Invalid TTL format: ${ttl}`);
  const unitValue = units[match[2]!];
  if (unitValue === undefined) throw new Error(`Unsupported TTL unit: ${match[2]}`);
  return parseInt(match[1]!, 10) * unitValue;
}

const accessCookieOpts: CookieSerializeOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: '/',
  maxAge: parseTtlSeconds(env.AUTH_ACCESS_TOKEN_TTL),
};

const refreshCookieOpts: CookieSerializeOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
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
