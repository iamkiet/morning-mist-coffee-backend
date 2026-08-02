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

export const VoiceSearchResultItemSchema = ProductSchema.extend({
  score: z.number().min(0).max(1),
});

export const VoiceSearchResponse = z.object({
  items: z.array(VoiceSearchResultItemSchema),
  transcript: z.string().nullable(),
  usedFallback: z.boolean(),
});
