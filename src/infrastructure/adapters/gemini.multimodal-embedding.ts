import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import { ExternalServiceError } from '../../lib/errors.ts';
import { GEMINI_EMBEDDING_MODEL, type GeminiClient } from './gemini.client.ts';

const TIMEOUT_MS = 15_000;
const RETRIEVAL_DOCUMENT = 'RETRIEVAL_DOCUMENT';

export class GeminiMultimodalEmbeddingAdapter implements MultimodalEmbeddingPort {
  constructor(private readonly gemini: GeminiClient) {}

  async embedText(text: string): Promise<number[]> {
    try {
      const response = await this.gemini.models.embedContent({
        model: GEMINI_EMBEDDING_MODEL,
        contents: [{ role: 'user', parts: [{ text }] }],
        config: {
          taskType: RETRIEVAL_DOCUMENT,
          httpOptions: { timeout: TIMEOUT_MS },
        },
      });
      return readEmbedding(response.embeddings, 'text');
    } catch (error) {
      throw new ExternalServiceError('Gemini', 'Failed to embed text', error);
    }
  }

  async embedAudio(audioBytes: Buffer, mimeType: string): Promise<number[]> {
    try {
      const response = await this.gemini.models.embedContent({
        model: GEMINI_EMBEDDING_MODEL,
        contents: [
          {
            role: 'user',
            parts: [{ inlineData: { mimeType, data: audioBytes.toString('base64') } }],
          },
        ],
        config: { httpOptions: { timeout: TIMEOUT_MS } },
      });
      return readEmbedding(response.embeddings, 'audio');
    } catch (error) {
      throw new ExternalServiceError('Gemini', 'Failed to embed audio', error);
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
