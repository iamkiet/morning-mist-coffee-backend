import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { RATE_LIMIT_CHAT_TEXT, RATE_LIMIT_CHAT_VOICE } from '../middlewares/rate-limits.ts';
import { ChatController } from '../controllers/chat.controller.ts';
import { requireAi } from '../middlewares/require-ai.ts';
import { ChatRequestSchema, ChatResponseSchema, ChatVoiceResponse } from '../schemas/chat.schema.ts';

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new ChatController(app.useCases.chat);

  fastify.post('/text', {
    config: RATE_LIMIT_CHAT_TEXT,
    onRequest: requireAi,
    schema: {
      tags: ['chat'],
      body: ChatRequestSchema,
      response: { 200: ChatResponseSchema },
    },
    handler: controller.handleChat,
  });

  fastify.post('/voice', {
    config: RATE_LIMIT_CHAT_VOICE,
    onRequest: requireAi,
    schema: {
      tags: ['chat'],
      response: { 200: ChatVoiceResponse },
    },
    handler: controller.handleVoiceChat,
  });
}
