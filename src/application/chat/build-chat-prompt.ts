import type { Product } from '../../domain/product/product.entity.ts';
import chatSystemPrompt from '../../prompts/chat-system.prompt.json' with { type: 'json' };

const BASE_INSTRUCTION = chatSystemPrompt.template;

export function wrapUserMessage(text: string): string {
  return `<user_message>\n${text}\n</user_message>`;
}

function formatProduct(p: Product): string {
  const price = `${p.priceCents.toLocaleString('vi-VN')} ₫`;
  const notes = p.tastingNotes.length > 0 ? p.tastingNotes.join(', ') : '—';
  return [
    `- ${p.name} (${price})`,
    `  nguồn gốc: ${p.origin ?? '—'}`,
    `  nốt hương: ${notes}`,
    `  mô tả: ${p.description ?? '—'}`,
  ].join('\n');
}

export function buildChatPrompt(products: Product[]): string {
  const catalogue =
    products.length > 0
      ? products.map(formatProduct).join('\n')
      : '(không tìm thấy sản phẩm phù hợp)';
  return `${BASE_INSTRUCTION}\nRelevant products for this question:\n${catalogue}`;
}
