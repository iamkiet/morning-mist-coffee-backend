import { ValidationError } from '../../lib/errors.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { ChatPort, ChatTurn } from '../../domain/ports/chat.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { Product } from '../../domain/product/product.entity.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { buildChatPrompt, wrapUserMessage } from './build-chat-prompt.ts';

const RETRIEVAL_LIMIT = 8;

export class SendChatMessageUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly chat: ChatPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(messages: ChatTurn[]): Promise<{ message: string; products: Product[] }> {
    const last = messages.at(-1);
    if (!last || last.role !== 'user') {
      throw new ValidationError('Last message must be from user');
    }

    const vector = await this.embedding.embedText(last.content).catch((err: unknown) => {
      this.logger.warn({ err }, 'Chat semantic retrieval failed, using keyword fallback');
      return null;
    });
    const relevant = await this.retrieveByVector(vector, last.content);
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.role === 'user' ? wrapUserMessage(m.content) : m.content,
    }));

    const message = await this.chat.reply(
      buildChatPrompt(relevant),
      history,
      wrapUserMessage(last.content),
    );
    return { message, products: relevant };
  }

  async replyToMessage(
    vector: number[] | null,
    message: string,
  ): Promise<{ message: string; products: Product[] }> {
    const relevant = await this.retrieveByVector(vector, message);
    const reply = await this.chat.reply(buildChatPrompt(relevant), [], wrapUserMessage(message));
    return { message: reply, products: relevant };
  }

  private async retrieveByVector(vector: number[] | null, question: string): Promise<Product[]> {
    if (vector) {
      try {
        const matches = await this.products.findSimilarByVector(vector, RETRIEVAL_LIMIT);
        if (matches.length > 0) return matches.map((m) => m.product);
      } catch (err) {
        this.logger.warn({ err }, 'Chat semantic retrieval failed, using keyword fallback');
      }
    }

    const byKeyword = await this.listProducts(question);
    return byKeyword.length > 0 ? byKeyword : this.listProducts('');
  }

  private listProducts(q: string): Promise<Product[]> {
    return this.products.list({
      ...(q ? { q } : {}),
      sortBy: 'createdAt',
      sortDir: 'desc',
      limit: RETRIEVAL_LIMIT,
      offset: 0,
    });
  }
}
