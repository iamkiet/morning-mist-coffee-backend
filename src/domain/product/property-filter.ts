export const PROPERTY_FILTER_NAMES = {
  origin: 'Xuất xứ',
  roast: 'Mức rang',
  process: 'Phương pháp chế biến',
} as const;

export type PropertyFilterKey = keyof typeof PROPERTY_FILTER_NAMES;
