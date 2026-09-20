import { z } from 'zod';
import { ProductSchema } from './product.schema.ts';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1, 'At least one message is required'),
});

export const ChatResponseSchema = z.object({
  message: z.string(),
  items: z.array(ProductSchema),
});

export const CHAT_VOICE_MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export const ChatVoiceAudioMimeType = z.enum([
  'audio/webm',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
]);

export const ChatVoiceResponse = z.object({
  message: z.string(),
  items: z.array(ProductSchema),
  transcript: z.string(),
});
