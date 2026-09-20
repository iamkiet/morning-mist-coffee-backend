import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { ChatPort, ChatTurn } from '../../domain/ports/chat.port.ts';
import type {
  ChatFilterExtractionPort,
  ExtractedProductFilter,
} from '../../domain/ports/chat-filter-extraction.port.ts';
import type { Product } from '../../domain/product/product.entity.ts';
import type { ProductWithVariants } from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { attachVariants } from '../product/attach-variants.ts';
import { preferVariantByWeight } from '../product/prefer-variant-by-weight.ts';
import { buildCatalogueProducts } from './build-catalogue-products.ts';
import { buildChatPrompt, wrapUserMessage } from './build-chat-prompt.ts';

const RETRIEVAL_LIMIT = 8;
const FALLBACK_REPLY =
  'Xin lỗi, trợ lý đang tạm quá tải. Đây là một vài gợi ý phù hợp, bạn thử lại sau ít phút để trò chuyện chi tiết hơn nhé.';

export interface AnswerQueryResult {
  message: string;
  items: ProductWithVariants[];
  weight?: string;
}

export class AnswerQueryService {
  constructor(
    private readonly products: ProductRepo,
    private readonly variants: ProductVariantRepo,
    private readonly chat: ChatPort,
    private readonly filterExtraction: ChatFilterExtractionPort,
    private readonly logger: AppLogger,
  ) {}

  async answer(
    vector: number[] | null | Promise<number[] | null>,
    question: string,
    history: ChatTurn[],
  ): Promise<AnswerQueryResult> {
    const [resolvedVector, filter] = await Promise.all([
      vector,
      this.filterExtraction.extract(question),
    ]);
    const relevant = await this.retrieveByVector(resolvedVector, question, filter);
    const message = await this.reply(relevant, history, question);
    const mentioned = this.filterMentioned(relevant, message);
    const attached = await attachVariants(this.variants, mentioned);
    const items = filter?.weight
      ? attached.map((p) => preferVariantByWeight(p, filter.weight as string))
      : attached;
    return { message, items, weight: filter?.weight };
  }

  private async reply(
    products: Product[],
    history: ChatTurn[],
    userMessage: string,
  ): Promise<string> {
    try {
      const catalogue = await buildCatalogueProducts(this.products, this.variants, products);
      return await this.chat.reply(
        buildChatPrompt(catalogue),
        history,
        wrapUserMessage(userMessage),
      );
    } catch (err) {
      this.logger.warn({ err }, 'Chat reply failed, returning fallback message');
      return FALLBACK_REPLY;
    }
  }

  private filterMentioned(products: Product[], reply: string): Product[] {
    const mentioned = products.filter((p) => reply.includes(p.name));
    return mentioned.length > 0 ? mentioned : products;
  }

  private async retrieveByVector(
    vector: number[] | null,
    question: string,
    filter: ExtractedProductFilter | null,
  ): Promise<Product[]> {
    if (vector) {
      try {
        const matches = await this.products.findSimilarByVector(
          vector,
          RETRIEVAL_LIMIT,
          filter ?? undefined,
        );
        if (matches.length > 0) return matches.map((m) => m.product);
      } catch (err) {
        this.logger.warn({ err }, 'Chat semantic retrieval failed, using keyword fallback');
      }
    }

    const byKeyword = await this.listProducts(question, filter);
    return byKeyword.length > 0 ? byKeyword : this.listProducts('', filter);
  }

  private listProducts(q: string, filter: ExtractedProductFilter | null): Promise<Product[]> {
    return this.products.list({
      ...(q ? { q } : {}),
      ...(filter?.priceMin !== undefined ? { priceMin: filter.priceMin } : {}),
      ...(filter?.priceMax !== undefined ? { priceMax: filter.priceMax } : {}),
      ...(filter?.weight !== undefined ? { weight: filter.weight } : {}),
      sortBy: 'createdAt',
      sortDir: 'desc',
      limit: RETRIEVAL_LIMIT,
      offset: 0,
    });
  }
}
