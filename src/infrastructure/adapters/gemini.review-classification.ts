import { Type, type GenerateContentConfig } from '@google/genai';
import { z } from 'zod';
import { ExternalServiceError } from '../../lib/errors.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type {
  ReviewClassificationInput,
  ReviewClassificationPort,
  ReviewClassificationResult,
} from '../../domain/ports/review-classification.port.ts';
import {
  REVIEW_CATEGORIES,
  REVIEW_SENTIMENTS,
  REVIEW_SEVERITIES,
} from '../../domain/product-review/product-review.entity.ts';
import { loadPromptTemplate } from '../../lib/load-template.ts';
import reviewClassificationPrompt from '../../prompts/configs/review-classification.json' with { type: 'json' };
import { GEMINI_FLASH_MODEL, type GeminiClient } from './gemini.client.ts';

const ReviewClassificationResultSchema = z.object({
  category: z.enum(REVIEW_CATEGORIES),
  severity: z.enum(REVIEW_SEVERITIES),
  sentiment: z.enum(REVIEW_SENTIMENTS),
  topics: z.array(z.string()),
  suggestedResponse: z.string(),
  confidence: z.enum(['high', 'low']),
});

const TIMEOUT_MS = 10_000;

const CONFIG: GenerateContentConfig = {
  systemInstruction: loadPromptTemplate(reviewClassificationPrompt.templateFile),
  responseMimeType: 'application/json',
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, enum: [...REVIEW_CATEGORIES] },
      severity: { type: Type.STRING, enum: [...REVIEW_SEVERITIES] },
      sentiment: { type: Type.STRING, enum: [...REVIEW_SENTIMENTS] },
      topics: { type: Type.ARRAY, items: { type: Type.STRING } },
      suggested_response: { type: Type.STRING },
      confidence: { type: Type.STRING, enum: ['high', 'low'] },
    },
    required: [
      'category',
      'severity',
      'sentiment',
      'topics',
      'suggested_response',
      'confidence',
    ],
  },
  httpOptions: { timeout: TIMEOUT_MS },
};

export class GeminiReviewClassificationAdapter implements ReviewClassificationPort {
  constructor(
    private readonly gemini: GeminiClient,
    private readonly logger: AppLogger,
  ) {}

  async classify(
    input: ReviewClassificationInput,
  ): Promise<ReviewClassificationResult | null> {
    try {
      const response = await this.gemini.models.generateContent({
        model: GEMINI_FLASH_MODEL,
        contents: JSON.stringify({
          rating: input.rating,
          comment_text: input.commentText,
          product_name: input.productName,
          source: input.source,
          follow_up_message: input.followUpMessage ?? null,
        }),
        config: CONFIG,
      });
      const text = response.text;
      if (text === undefined) throw new ExternalServiceError('Gemini', 'Empty review classification response');
      const raw = JSON.parse(text.trim());
      return ReviewClassificationResultSchema.parse({
        category: raw.category,
        severity: raw.severity,
        sentiment: raw.sentiment,
        topics: raw.topics,
        suggestedResponse: raw.suggested_response,
        confidence: raw.confidence,
      });
    } catch (error) {
      this.logger.warn(
        { err: error },
        'Review classification failed, leaving review unclassified',
      );
      return null;
    }
  }
}
