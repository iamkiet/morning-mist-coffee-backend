import type { FastifyRequest } from 'fastify';

export function aiSecurityGuard(endpoint: string) {
  return async (req: FastifyRequest): Promise<void> => {
    // Run validation if there's a request body
    if (req.body) {
      await req.server.aiSecurity.validatePayloadAsync(endpoint, req.ip, req.body);
    }
  };
}
