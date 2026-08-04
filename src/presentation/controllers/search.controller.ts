import type { FastifyReply, FastifyRequest } from 'fastify';
import type { SearchProductsByVoiceUseCase } from '../../application/product/search-products-by-voice.use-case.ts';
import { ValidationError } from '../../lib/errors.ts';
import {
  VOICE_SEARCH_MAX_AUDIO_BYTES,
  VoiceSearchAudioUpload,
} from '../schemas/search.schema.ts';
import { toProductDTO } from '../serializers/product.serializer.ts';

export interface SearchUseCases {
  voiceSearch: SearchProductsByVoiceUseCase;
}

export class SearchController {
  constructor(private readonly uc: SearchUseCases) {}

  voiceSearch = async (req: FastifyRequest, reply: FastifyReply) => {
    const data = await req.file({ limits: { fileSize: VOICE_SEARCH_MAX_AUDIO_BYTES } });
    if (!data) {
      throw new ValidationError('Missing audio file (multipart field required)');
    }

    const audioBytes = await data.toBuffer();
    if ((data.file as unknown as { truncated?: boolean }).truncated === true) {
      throw new ValidationError(
        `Audio file too large (max ${VOICE_SEARCH_MAX_AUDIO_BYTES / (1024 * 1024)}MB)`,
      );
    }

    const parsed = VoiceSearchAudioUpload.safeParse({
      mimeType: data.mimetype,
      byteLength: audioBytes.length,
    });
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid audio upload');
    }

    const result = await this.uc.voiceSearch.execute({
      audioBytes,
      mimeType: parsed.data.mimeType,
    });

    return reply.send({
      message: result.message,
      items: result.items.map((item) => toProductDTO(item)),
      transcript: result.transcript,
    });
  };
}
