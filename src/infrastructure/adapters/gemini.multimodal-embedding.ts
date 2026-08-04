import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import { ExternalServiceError } from '../../lib/errors.ts';
import { GEMINI_EMBEDDING_MODEL, type GeminiClient } from './gemini.client.ts';

const TIMEOUT_MS = 15_000;
const RETRIEVAL_DOCUMENT = 'RETRIEVAL_DOCUMENT';
const RETRIEVAL_QUERY = 'RETRIEVAL_QUERY';

export class GeminiMultimodalEmbeddingAdapter implements MultimodalEmbeddingPort {
  constructor(private readonly gemini: GeminiClient) {}

  async embedDocument(text: string): Promise<number[]> {
    return this.embed({ text }, RETRIEVAL_DOCUMENT, 'text');
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.embed({ text }, RETRIEVAL_QUERY, 'text');
  }

  async embedAudioQuery(audioBytes: Buffer, mimeType: string): Promise<number[]> {
    return this.embed(
      { inlineData: { mimeType, data: audioBytes.toString('base64') } },
      RETRIEVAL_QUERY,
      'audio',
    );
  }

  private async embed(
    part: { text: string } | { inlineData: { mimeType: string; data: string } },
    taskType: string,
    kind: string,
  ): Promise<number[]> {
    try {
      const response = await this.gemini.models.embedContent({
        model: GEMINI_EMBEDDING_MODEL,
        contents: [{ role: 'user', parts: [part] }],
        config: {
          taskType,
          httpOptions: { timeout: TIMEOUT_MS },
        },
      });
      return readEmbedding(response.embeddings, kind);
    } catch (error) {
      throw new ExternalServiceError('Gemini', `Failed to embed ${kind}`, error);
    }
  }
}

function readEmbedding(
  embeddings: Array<{ values?: number[] }> | undefined,
  kind: string,
): number[] {
  const values = embeddings?.[0]?.values;
  if (values === undefined || values.length === 0) {
    throw new ExternalServiceError('Gemini', `Empty ${kind} embedding response`);
  }
  return values;
}
