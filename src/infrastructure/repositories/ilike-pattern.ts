const LIKE_SPECIALS = /[\\%_]/g;

function escapeLike(value: string): string {
  return value.replace(LIKE_SPECIALS, (char) => `\\${char}`);
}

export function containsPattern(value: string): string {
  return `%${escapeLike(value)}%`;
}

export function prefixPattern(value: string): string {
  return `${escapeLike(value)}%`;
}
