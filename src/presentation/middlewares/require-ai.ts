import type { FastifyRequest } from 'fastify';
import { AiNotConfiguredError } from '../../lib/errors.ts';

export async function requireAi(req: FastifyRequest): Promise<void> {
  if (!req.server.gemini.configured) {
    throw new AiNotConfiguredError();
  }
}
