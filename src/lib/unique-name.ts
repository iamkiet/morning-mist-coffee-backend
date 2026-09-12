import { ConflictError } from './errors.ts';

export async function resolveUniqueName(
  name: string,
  findByName: (name: string) => Promise<{ id: string } | null>,
  resourceLabel: string,
  excludeId?: string,
): Promise<string> {
  const trimmed = name.trim();
  const existing = await findByName(trimmed);
  if (existing && existing.id !== excludeId) {
    throw new ConflictError(`${resourceLabel} '${trimmed}' already exists`);
  }
  return trimmed;
}
