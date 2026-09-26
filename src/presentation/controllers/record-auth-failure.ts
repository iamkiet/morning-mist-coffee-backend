import type { FastifyRequest } from 'fastify';
import type { SecurityEventType } from '../../domain/security/security-event.entity.ts';

export async function withAuthFailureLogging<T>(
  req: FastifyRequest,
  type: Extract<
    SecurityEventType,
    'security_event_customer_login_fail' | 'security_event_employee_login_fail'
  >,
  endpoint: string,
  email: string,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (err) {
    req.log.warn({ event: type, email, ip: req.ip }, `${type} recorded`);
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
