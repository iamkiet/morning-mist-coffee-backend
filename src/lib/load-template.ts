import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TEMPLATES_DIR = fileURLToPath(new URL('../prompts/templates/', import.meta.url));

export function loadPromptTemplate(fileName: string): string {
  return readFileSync(`${TEMPLATES_DIR}${fileName}`, 'utf-8').trim();
}
