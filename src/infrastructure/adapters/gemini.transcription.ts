import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { TranscriptionPort } from '../../domain/ports/transcription.port.js';
import { ExternalServiceError } from '../../lib/errors.js';

const TIMEOUT_MS = 15_000;

export class GeminiTranscriptionAdapter implements TranscriptionPort {
  private model: GenerativeModel;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction:
        'Transcribe the given Vietnamese audio to plain text exactly as spoken. Reply with the transcript only, no extra commentary, no quotes.',
    });
  }

  async transcribe(audioBytes: Buffer, mimeType: string): Promise<string> {
    try {
      const result = await this.model.generateContent(
        {
          contents: [
            {
              role: 'user',
              parts: [{ inlineData: { mimeType, data: audioBytes.toString('base64') } }],
            },
          ],
        },
        { timeout: TIMEOUT_MS },
      );
      return result.response.text().trim();
    } catch (error) {
      throw new ExternalServiceError('Gemini', 'Failed to transcribe audio', error);
    }
  }
}
