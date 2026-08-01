import { GoogleGenerativeAI, TaskType, type GenerativeModel } from '@google/generative-ai';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.js';
import { ExternalServiceError } from '../../lib/errors.js';

const TIMEOUT_MS = 15_000;
const MODEL_NAME = 'gemini-embedding-2';

export class GeminiMultimodalEmbeddingAdapter implements MultimodalEmbeddingPort {
  private model: GenerativeModel;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: MODEL_NAME });
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const result = await this.model.embedContent(
        {
          content: { role: 'user', parts: [{ text }] },
          taskType: TaskType.RETRIEVAL_DOCUMENT,
        },
        { timeout: TIMEOUT_MS },
      );
      return result.embedding.values;
    } catch (error) {
      throw new ExternalServiceError('Gemini', 'Failed to embed text', error);
    }
  }

  async embedAudio(audioBytes: Buffer, mimeType: string): Promise<number[]> {
    try {
      const result = await this.model.embedContent(
        {
          content: {
            role: 'user',
            parts: [{ inlineData: { mimeType, data: audioBytes.toString('base64') } }],
          },
        },
        { timeout: TIMEOUT_MS },
      );
      return result.embedding.values;
    } catch (error) {
      throw new ExternalServiceError('Gemini', 'Failed to embed audio', error);
    }
  }
}
