export const CURRENCIES = ['USD', 'VND'] as const;
export type Currency = (typeof CURRENCIES)[number];
