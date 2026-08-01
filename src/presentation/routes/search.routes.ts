import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from '../../config/env.js';
import { SearchController } from '../controllers/search.controller.js';
import { VoiceSearchResponse } from '../schemas/search.schema.js';

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
    schema: {
      tags: ['search'],
      response: { 200: VoiceSearchResponse },
    },
    handler: controller.voiceSearch,
  });
}
