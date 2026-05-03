export type SortDirection = 'asc' | 'desc';

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export function mapPaginated<T, U>(page: Paginated<T>, fn: (item: T) => U): Paginated<U> {
  return {
    items: page.items.map(fn),
    total: page.total,
    limit: page.limit,
    offset: page.offset,
  };
}
