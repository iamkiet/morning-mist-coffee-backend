import { GoogleGenAI } from '@google/genai';
import { AiNotConfiguredError } from '../../lib/errors.ts';

export const GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
export const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-2';

export class GeminiClient {
  private client: GoogleGenAI | null = null;

  constructor(private readonly apiKey: string | undefined) {}

  get configured(): boolean {
    return this.apiKey !== undefined;
  }

  get models(): GoogleGenAI['models'] {
    return this.api().models;
  }

  get chats(): GoogleGenAI['chats'] {
    return this.api().chats;
  }

  private api(): GoogleGenAI {
    if (this.apiKey === undefined) throw new AiNotConfiguredError();
    this.client ??= new GoogleGenAI({ apiKey: this.apiKey });
    return this.client;
  }
}
