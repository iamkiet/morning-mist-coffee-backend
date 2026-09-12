export const CURRENCIES = ['VND'] as const;
export type Currency = (typeof CURRENCIES)[number];

export function formatCents(cents: number): string {
  return `${cents.toLocaleString('vi-VN')} ₫`;
}
