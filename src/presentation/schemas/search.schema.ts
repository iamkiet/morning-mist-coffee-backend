import { z } from 'zod';
import { ProductSchema } from './product.schema.ts';

export const VOICE_SEARCH_MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export const VoiceSearchAudioMimeType = z.enum([
  'audio/webm',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
]);

export const VoiceSearchAudioUpload = z.object({
  mimeType: VoiceSearchAudioMimeType,
  byteLength: z.number().int().positive().max(VOICE_SEARCH_MAX_AUDIO_BYTES),
});

export const VoiceSearchResponse = z.object({
  message: z.string(),
  items: z.array(ProductSchema),
  transcript: z.string().nullable(),
});
