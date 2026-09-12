// Category names are stored flat with " | " as a lightweight path separator
// for admin UI display (e.g. "Đồ uống | Cà Phê | Arabica"). That separator
// reads as broken Vietnamese inside a natural-language sentence, so anything
// feeding an embedding or an LLM prompt must convert it to natural wording
// first — a literal "|" is not how a Vietnamese speaker writes a category list.
export function toNaturalCategoryLabel(name: string): string {
  return name.replace(/\s*\|\s*/g, ', ');
}
