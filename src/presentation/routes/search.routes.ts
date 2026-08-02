import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from '../../config/env.ts';
import { SearchController } from '../controllers/search.controller.ts';
import { requireAi } from '../middlewares/require-ai.ts';
import { VoiceSearchResponse } from '../schemas/search.schema.ts';

const voiceSearchRateLimit = {
  rateLimit: {
    max: env.SEARCH_VOICE_RATE_MAX,
    timeWindow: env.SEARCH_VOICE_RATE_WINDOW,
  },
};

export async function searchRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new SearchController(app.useCases.search);

  fastify.post('/voice', {
    config: voiceSearchRateLimit,
    onRequest: requireAi,
    schema: {
      tags: ['search'],
      response: { 200: VoiceSearchResponse },
    },
    handler: controller.voiceSearch,
  });
}
