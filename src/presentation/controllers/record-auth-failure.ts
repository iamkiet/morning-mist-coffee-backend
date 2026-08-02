import type { FastifyRequest } from 'fastify';
import type { SecurityEventType } from '../../domain/security/security-event.entity.ts';

export async function withAuthFailureLogging<T>(
  req: FastifyRequest,
  type: Extract<SecurityEventType, 'login_fail' | 'register_fail'>,
  endpoint: string,
  email: string,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (err) {
    req.log.warn({ event: `auth.${type}`, email, ip: req.ip }, `${type} recorded`);
    req.server.securityEvents.record({
      type,
      ip: req.ip,
      occurredAt: new Date(),
      endpoint,
      email,
      userAgent: req.headers['user-agent'],
    });
    throw err;
  }
}
