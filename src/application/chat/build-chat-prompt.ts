import chatSystemPrompt from '../../prompts/chat-system.prompt.json' with { type: 'json' };

const BASE_INSTRUCTION = chatSystemPrompt.template;

export interface ChatCatalogueVariant {
  priceCents: number;
  stock: number;
  propertyValues: Array<{ propertyName: string; value: string }>;
}

export interface ChatCatalogueProduct {
  name: string;
  description: string | null;
  categoryNames: string[];
  variants: ChatCatalogueVariant[];
}

export function wrapUserMessage(text: string): string {
  return `<user_message>\n${text}\n</user_message>`;
}

function formatVariant(v: ChatCatalogueVariant): string {
  const price = `${v.priceCents.toLocaleString('vi-VN')} ₫`;
  const stock = v.stock > 0 ? `còn ${v.stock}` : 'hết hàng';
  const properties = v.propertyValues.map((p) => `${p.propertyName}: ${p.value}`).join(', ');
  return `    - ${price} — ${stock}${properties ? ` — ${properties}` : ''}`;
}

function formatProduct(p: ChatCatalogueProduct): string {
  const lines = [`- ${p.name}`];
  if (p.categoryNames.length > 0) {
    lines.push(`  danh mục: ${p.categoryNames.join(', ')}`);
  }
  lines.push(`  mô tả: ${p.description ?? '—'}`);
  lines.push('  các loại:');
  for (const variant of p.variants) {
    lines.push(formatVariant(variant));
  }
  return lines.join('\n');
}

export function buildChatPrompt(products: ChatCatalogueProduct[]): string {
  const catalogue =
    products.length > 0
      ? products.map(formatProduct).join('\n')
      : '(không tìm thấy sản phẩm phù hợp)';
  return `${BASE_INSTRUCTION}\nRelevant products for this question:\n${catalogue}`;
}
