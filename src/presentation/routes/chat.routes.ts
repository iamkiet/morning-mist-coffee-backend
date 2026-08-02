import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from '../../config/env.ts';
import { ChatController } from '../controllers/chat.controller.ts';
import { requireAi } from '../middlewares/require-ai.ts';
import { ChatRequestSchema, ChatResponseSchema } from '../schemas/chat.schema.ts';

const chatRateLimit = {
  rateLimit: {
    max: env.CHAT_RATE_MAX,
    timeWindow: env.CHAT_RATE_WINDOW,
  },
};

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new ChatController(app.useCases.chat);

  fastify.post('/', {
    config: chatRateLimit,
    onRequest: requireAi,
    schema: {
      tags: ['chat'],
      body: ChatRequestSchema,
      response: { 200: ChatResponseSchema },
    },
    handler: controller.handleChat,
  });
}
