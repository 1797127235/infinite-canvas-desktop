import { getLLMText, source } from '@/lib/source';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const revalidate = false;

export async function GET() {
  const docsIndex = await readFile(join(process.cwd(), 'index.md'), 'utf8');
  const scanned = await Promise.all(source.getPages('zh-CN').map(getLLMText));

  return new Response([docsIndex, ...scanned].join('\n\n'));
}
