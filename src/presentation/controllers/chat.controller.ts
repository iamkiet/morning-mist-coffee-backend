import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { SendChatMessageUseCase } from '../../application/chat/send-chat-message.use-case.js';
import { env } from '../../config/env.js';
import type { ChatRequestSchema } from '../schemas/chat.schema.js';

export interface ChatUseCases {
  send: SendChatMessageUseCase;
}

export class ChatController {
  constructor(private readonly uc: ChatUseCases) {}

  handleChat = async (
    req: FastifyRequest<{ Body: z.infer<typeof ChatRequestSchema> }>,
    reply: FastifyReply,
  ) => {
    if (!env.GEMINI_API_KEY) {
      return reply
        .code(503)
        .send({ error: 'AI_NOT_CONFIGURED', message: 'Gemini API is not configured' });
    }
    const message = await this.uc.send.execute(req.body.messages);
    return reply.send({ message });
  };
}
