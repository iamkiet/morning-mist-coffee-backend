import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ChatController } from '../controllers/chat.controller.js';
import { ChatRequestSchema, ChatResponseSchema } from '../schemas/chat.schema.js';

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new ChatController(app.useCases.product);

  fastify.post('/', {
    schema: {
      tags: ['chat'],
      body: ChatRequestSchema,
      response: { 200: ChatResponseSchema },
    },
    handler: controller.handleChat,
  });
}
