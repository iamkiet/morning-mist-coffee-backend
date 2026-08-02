const COMBINING_MARKS = /[̀-ͯ]/g;
const D_STROKE = /[đĐ]/g;
const NON_ALPHANUMERIC = /[^a-z0-9]+/g;
const EDGE_DASHES = /^-+|-+$/g;

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(D_STROKE, 'd')
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, '-')
    .replace(EDGE_DASHES, '');
}

export function isSlug(value: string): boolean {
  return value.length > 0 && slugify(value) === value;
}

export function nextSlugCandidate(base: string, attempt: number): string {
  return attempt === 0 ? base : `${base}-${attempt + 1}`;
}
