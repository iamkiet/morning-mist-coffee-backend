import type { TranscriptionPort } from '../../domain/ports/transcription.port.ts';
import { ExternalServiceError } from '../../lib/errors.ts';
import transcriptionPrompt from '../../prompts/transcription.prompt.json' with { type: 'json' };
import { GEMINI_FLASH_MODEL, type GeminiClient } from './gemini.client.ts';

const TIMEOUT_MS = 15_000;

const SYSTEM_INSTRUCTION = transcriptionPrompt.template;

export class GeminiTranscriptionAdapter implements TranscriptionPort {
  constructor(private readonly gemini: GeminiClient) {}

  async transcribe(audioBytes: Buffer, mimeType: string): Promise<string> {
    try {
      const response = await this.gemini.models.generateContent({
        model: GEMINI_FLASH_MODEL,
        contents: [
          {
            role: 'user',
            parts: [{ inlineData: { mimeType, data: audioBytes.toString('base64') } }],
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          httpOptions: { timeout: TIMEOUT_MS },
        },
      });
      return response.text?.trim() ?? '';
    } catch (error) {
      throw new ExternalServiceError('Gemini', 'Failed to transcribe audio', error);
    }
  }
}
