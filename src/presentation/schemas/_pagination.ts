import { z } from 'zod';

export const sortDirection = z.enum(['asc', 'desc']);

export const paginationFields = {
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
};

export function sortFields<const T extends readonly [string, ...string[]]>(allowed: T) {
  return {
    sortBy: z.enum(allowed).default(allowed[0]),
    sortDir: sortDirection.default('desc'),
  };
}

export function paginatedResponse<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  });
}
