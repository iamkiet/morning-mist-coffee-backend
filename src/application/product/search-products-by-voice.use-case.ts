import type { Product } from '../../domain/product/product.entity.ts';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.ts';
import type { AudioConverterPort } from '../../domain/ports/audio-converter.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { TranscriptionPort } from '../../domain/ports/transcription.port.ts';
import { ExternalServiceError } from '../../lib/errors.ts';
import type { SendChatMessageUseCase } from '../chat/send-chat-message.use-case.ts';

export interface SearchProductsByVoiceInput {
  audioBytes: Buffer;
  mimeType: string;
}

export interface VoiceSearchResult {
  message: string;
  items: Array<Product & { stockQuantity: number }>;
  transcript: string;
}

export class SearchProductsByVoiceUseCase {
  constructor(
    private readonly stockRepo: ProductStockRepo,
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

    const transcript = await this.transcriptionPort
      .transcribe(wavBytes, 'audio/wav')
      .catch(() => null);
    if (!transcript) {
      throw new ExternalServiceError('transcription', 'Could not understand the audio');
    }

    const queryVectorPromise = this.embeddingPort.embedAudioQuery(wavBytes, 'audio/wav');
    const { message, products } = await this.chatUseCase.replyToMessage(
      queryVectorPromise,
      transcript,
    );

    const stockMap = await this.stockRepo.getByProductIds(products.map((p) => p.id));
    const items = products.map((p) => ({
      ...p,
      stockQuantity: stockMap.get(p.id) ?? 0,
    }));

    return { message, items, transcript };
  }
}
