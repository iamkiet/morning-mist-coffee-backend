import { ValidationError } from '../../lib/errors.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { ChatPort, ChatTurn } from '../../domain/ports/chat.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { ProductFilterExtractionPort } from '../../domain/ports/product-filter-extraction.port.ts';
import type { Product } from '../../domain/product/product.entity.ts';
import type { PriceRange, ProductRepo } from '../../domain/product/product.repo.ts';
import { buildChatPrompt, wrapUserMessage } from './build-chat-prompt.ts';

const RETRIEVAL_LIMIT = 8;

export class SendChatMessageUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly chat: ChatPort,
    private readonly filterExtraction: ProductFilterExtractionPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(messages: ChatTurn[]): Promise<{ message: string; products: Product[] }> {
    const last = messages.at(-1);
    if (!last || last.role !== 'user') {
      throw new ValidationError('Last message must be from user');
    }

    const [vector, priceFilter] = await Promise.all([
      this.embedding.embedText(last.content).catch((err: unknown) => {
        this.logger.warn({ err }, 'Chat semantic retrieval failed, using keyword fallback');
        return null;
      }),
      this.filterExtraction.extract(last.content),
    ]);
    const relevant = await this.retrieveByVector(vector, last.content, priceFilter);
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.role === 'user' ? wrapUserMessage(m.content) : m.content,
    }));

    const message = await this.chat.reply(
      buildChatPrompt(relevant),
      history,
      wrapUserMessage(last.content),
    );
    return { message, products: this.filterMentioned(relevant, message) };
  }

  async replyToMessage(
    vector: number[] | null | Promise<number[] | null>,
    message: string,
  ): Promise<{ message: string; products: Product[] }> {
    const [resolvedVector, priceFilter] = await Promise.all([
      vector,
      this.filterExtraction.extract(message),
    ]);
    const relevant = await this.retrieveByVector(resolvedVector, message, priceFilter);
    const reply = await this.chat.reply(buildChatPrompt(relevant), [], wrapUserMessage(message));
    return { message: reply, products: this.filterMentioned(relevant, reply) };
  }

  private filterMentioned(products: Product[], reply: string): Product[] {
    const mentioned = products.filter((p) => reply.includes(p.name));
    return mentioned.length > 0 ? mentioned : products;
  }

  private async retrieveByVector(
    vector: number[] | null,
    question: string,
    priceFilter: PriceRange | null,
  ): Promise<Product[]> {
    if (vector) {
      try {
        const matches = await this.products.findSimilarByVector(
          vector,
          RETRIEVAL_LIMIT,
          priceFilter ?? undefined,
        );
        if (matches.length > 0) return matches.map((m) => m.product);
      } catch (err) {
        this.logger.warn({ err }, 'Chat semantic retrieval failed, using keyword fallback');
      }
    }

    const byKeyword = await this.listProducts(question, priceFilter);
    return byKeyword.length > 0 ? byKeyword : this.listProducts('', priceFilter);
  }

  private listProducts(q: string, priceFilter: PriceRange | null): Promise<Product[]> {
    return this.products.list({
      ...(q ? { q } : {}),
      ...(priceFilter?.priceMin !== undefined ? { priceMin: priceFilter.priceMin } : {}),
      ...(priceFilter?.priceMax !== undefined ? { priceMax: priceFilter.priceMax } : {}),
      sortBy: 'createdAt',
      sortDir: 'desc',
      limit: RETRIEVAL_LIMIT,
      offset: 0,
    });
  }
}
