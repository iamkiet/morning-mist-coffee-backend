import { Type, type GenerateContentConfig } from '@google/genai';
import { z } from 'zod';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { ProductFilterExtractionPort } from '../../domain/ports/product-filter-extraction.port.ts';
import type { PriceRange } from '../../domain/product/product.entity.ts';
import productFilterExtractionPrompt from '../../prompts/product-filter-extraction.prompt.json' with { type: 'json' };
import { GEMINI_FLASH_MODEL, type GeminiClient } from './gemini.client.ts';

const PriceRangeSchema = z.object({
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
});

const TIMEOUT_MS = 10_000;

const CONFIG: GenerateContentConfig = {
  systemInstruction: productFilterExtractionPrompt.template,
  responseMimeType: 'application/json',
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      priceMin: { type: Type.INTEGER },
      priceMax: { type: Type.INTEGER },
    },
  },
  httpOptions: { timeout: TIMEOUT_MS },
};

export class GeminiProductFilterExtractionAdapter implements ProductFilterExtractionPort {
  constructor(
    private readonly gemini: GeminiClient,
    private readonly logger: AppLogger,
  ) {}

  async extract(question: string): Promise<PriceRange | null> {
    try {
      const response = await this.gemini.models.generateContent({
        model: GEMINI_FLASH_MODEL,
        contents: question,
        config: CONFIG,
      });
      const text = response.text;
      if (text === undefined) throw new Error('Empty price filter extraction response');
      const parsed = PriceRangeSchema.parse(JSON.parse(text.trim()));
      return parsed.priceMin === undefined && parsed.priceMax === undefined ? null : parsed;
    } catch (error) {
      this.logger.warn({ err: error }, 'Price filter extraction failed, skipping price filter');
      return null;
    }
  }
}
