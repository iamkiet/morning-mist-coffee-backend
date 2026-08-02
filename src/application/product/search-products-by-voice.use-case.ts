import type { Product } from '../../domain/product/product.entity.ts';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { AudioConverterPort } from '../../domain/ports/audio-converter.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { TranscriptionPort } from '../../domain/ports/transcription.port.ts';

const RESULT_LIMIT = 10;

export interface SearchProductsByVoiceInput {
  audioBytes: Buffer;
  mimeType: string;
}

export interface VoiceSearchResultItem extends Product {
  score: number;
}

export interface VoiceSearchResult {
  items: VoiceSearchResultItem[];
  transcript: string | null;
  usedFallback: boolean;
}

export class SearchProductsByVoiceUseCase {
  constructor(
    private readonly productRepo: ProductRepo,
    private readonly stockRepo: ProductStockRepo,
    private readonly embeddingPort: MultimodalEmbeddingPort,
    private readonly transcriptionPort: TranscriptionPort,
    private readonly audioConverter: AudioConverterPort,
    private readonly similarityThreshold: number,
    private readonly maxDurationSeconds: number,
  ) {}

  async execute(input: SearchProductsByVoiceInput): Promise<VoiceSearchResult> {
    const { wavBytes } = await this.audioConverter.convertToWav(
      input.audioBytes,
      input.mimeType,
      this.maxDurationSeconds,
    );

    const queryVector = await this.embeddingPort.embedAudio(wavBytes, 'audio/wav');
    const matches = await this.productRepo.findSimilarByVector(queryVector, RESULT_LIMIT);
    const topScore = matches[0]?.score ?? 0;

    const transcript = await this.transcriptionPort
      .transcribe(wavBytes, 'audio/wav')
      .catch(() => null);

    let items: Array<Product & { score: number }> = matches.map((m) => ({
      ...m.product,
      score: m.score,
    }));
    let usedFallback = false;

    if (topScore < this.similarityThreshold && transcript) {
      usedFallback = true;
      const fallbackItems = await this.productRepo.list({
        q: transcript,
        sortBy: 'createdAt',
        sortDir: 'desc',
        limit: RESULT_LIMIT,
        offset: 0,
      });
      items = fallbackItems.map((p) => ({ ...p, score: 0 }));
    }

    const stockMap = await this.stockRepo.getByProductIds(items.map((p) => p.id));
    const itemsWithStock = items.map((p) => ({
      ...p,
      stockQuantity: stockMap.get(p.id) ?? 0,
    }));

    return { items: itemsWithStock, transcript, usedFallback };
  }
}
