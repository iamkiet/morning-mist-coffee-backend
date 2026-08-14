import chatSystemPrompt from '../../prompts/chat-system.prompt.json' with { type: 'json' };

const BASE_INSTRUCTION = chatSystemPrompt.template;

export interface ChatCatalogueProduct {
  name: string;
  description: string | null;
  priceCents: number | null;
  propertyLines: Array<{ propertyName: string; value: string }>;
}

export function wrapUserMessage(text: string): string {
  return `<user_message>\n${text}\n</user_message>`;
}

function formatProduct(p: ChatCatalogueProduct): string {
  const price = p.priceCents !== null ? `${p.priceCents.toLocaleString('vi-VN')} ₫` : '—';
  const lines = [`- ${p.name} (${price})`];
  for (const { propertyName, value } of p.propertyLines) {
    lines.push(`  ${propertyName}: ${value}`);
  }
  lines.push(`  mô tả: ${p.description ?? '—'}`);
  return lines.join('\n');
}

export function buildChatPrompt(products: ChatCatalogueProduct[]): string {
  const catalogue =
    products.length > 0
      ? products.map(formatProduct).join('\n')
      : '(không tìm thấy sản phẩm phù hợp)';
  return `${BASE_INSTRUCTION}\nRelevant products for this question:\n${catalogue}`;
}
