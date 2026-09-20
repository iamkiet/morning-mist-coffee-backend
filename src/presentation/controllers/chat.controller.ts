import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { SendChatMessageUseCase } from '../../application/chat/send-chat-message.use-case.ts';
import { ValidationError } from '../../lib/errors.ts';
import {
  CHAT_VOICE_MAX_AUDIO_BYTES,
  ChatMessageSchema,
  ChatVoiceAudioMimeType,
  type ChatRequestSchema,
} from '../schemas/chat.schema.ts';
import { toProductDTO } from '../serializers/product.serializer.ts';

export interface ChatUseCases {
  send: SendChatMessageUseCase;
}

export class ChatController {
  constructor(private readonly uc: ChatUseCases) {}

  handleChat = async (
    req: FastifyRequest<{ Body: z.infer<typeof ChatRequestSchema> }>,
    reply: FastifyReply,
  ) => {
    const result = await this.uc.send.execute(req.body.messages);
    return reply.send({
      message: result.message,
      items: result.items.map((item) => toProductDTO(item)),
    });
  };

  handleVoiceChat = async (req: FastifyRequest, reply: FastifyReply) => {
    const data = await req.file({ limits: { fileSize: CHAT_VOICE_MAX_AUDIO_BYTES } });
    if (!data) {
      throw new ValidationError('Missing audio file (multipart field required)');
    }

    const audioBytes = await data.toBuffer();
    if ((data.file as unknown as { truncated?: boolean }).truncated === true) {
      throw new ValidationError(
        `Audio file too large (max ${CHAT_VOICE_MAX_AUDIO_BYTES / (1024 * 1024)}MB)`,
      );
    }

    const mimeParsed = ChatVoiceAudioMimeType.safeParse(data.mimetype);
    if (!mimeParsed.success) {
      throw new ValidationError('Unsupported audio format');
    }

    const messages = parseHistoryField(data.fields.messages);

    const result = await this.uc.send.execute(messages, {
      bytes: audioBytes,
      mimeType: mimeParsed.data,
    });

    return reply.send({
      message: result.message,
      items: result.items.map((item) => toProductDTO(item)),
      transcript: result.transcript,
    });
  };
}

function parseHistoryField(field: unknown): z.infer<typeof ChatMessageSchema>[] {
  const raw =
    field && !Array.isArray(field) && (field as { type?: string }).type === 'field'
      ? (field as { value: unknown }).value
      : '[]';

  let json: unknown;
  try {
    json = JSON.parse(String(raw));
  } catch {
    throw new ValidationError('Invalid messages field: not valid JSON');
  }

  const parsed = ChatMessageSchema.array().safeParse(json);
  if (!parsed.success) {
    throw new ValidationError('Invalid messages field');
  }
  return parsed.data;
}
