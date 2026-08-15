import type { ProductWithVariants } from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { AudioConverterPort } from '../../domain/ports/audio-converter.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { TranscriptionPort } from '../../domain/ports/transcription.port.ts';
import { ValidationError } from '../../lib/errors.ts';
import type { SendChatMessageUseCase } from '../chat/send-chat-message.use-case.ts';
import { attachVariants } from './attach-variants.ts';
import { preferVariantByWeight } from './prefer-variant-by-weight.ts';

export interface SearchProductsByVoiceInput {
  audioBytes: Buffer;
  mimeType: string;
}

export interface VoiceSearchResult {
  message: string;
  items: ProductWithVariants[];
  transcript: string;
}

export class SearchProductsByVoiceUseCase {
  constructor(
    private readonly variants: ProductVariantRepo,
    private readonly embeddingPort: MultimodalEmbeddingPort,
    private readonly transcriptionPort: TranscriptionPort,
    private readonly audioConverter: AudioConverterPort,
    private readonly chatUseCase: SendChatMessageUseCase,
    private readonly maxDurationSeconds: number,
  ) {}

  async execute(input: SearchProductsByVoiceInput): Promise<VoiceSearchResult> {
    const { wavBytes } = await this.audioConverter.convertToWav(
      input.audioBytes,
      input.mimeType,
      this.maxDurationSeconds,
    );

    const transcript = await this.transcriptionPort.transcribe(wavBytes, 'audio/wav');
    if (!transcript) {
      throw new ValidationError('Could not understand the audio');
    }

    const queryVectorPromise = this.embeddingPort.embedAudioQuery(wavBytes, 'audio/wav');
    const { message, products, weight } = await this.chatUseCase.replyToMessage(
      queryVectorPromise,
      transcript,
    );

    const attached = await attachVariants(this.variants, products);
    const items = weight ? attached.map((p) => preferVariantByWeight(p, weight)) : attached;

    return { message, items, transcript };
  }
}
