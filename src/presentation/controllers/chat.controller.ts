import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { SendChatMessageUseCase } from '../../application/chat/send-chat-message.use-case.ts';
import type { ChatRequestSchema } from '../schemas/chat.schema.ts';

export interface ChatUseCases {
  send: SendChatMessageUseCase;
}

export class ChatController {
  constructor(private readonly uc: ChatUseCases) {}

  handleChat = async (
    req: FastifyRequest<{ Body: z.infer<typeof ChatRequestSchema> }>,
    reply: FastifyReply,
  ) => {
    const message = await this.uc.send.execute(req.body.messages);
    return reply.send({ message });
  };
}
