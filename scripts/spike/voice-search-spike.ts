/**
 * PHASE 1a SPIKE — validates whether gemini-embedding-2 can tell Vietnamese
 * voice queries apart by coffee-shop product domain, audio-to-text
 * cross-modal, before Phase 1 is built on top of that assumption.
 *
 * Not part of the app architecture — throwaway experiment script.
 *
 * Requires macOS `say` (Vietnamese voice "Linh") + `afconvert` to synthesize
 * query audio locally (no real microphone recordings available in this
 * environment). This is a stand-in for real human speech, acceptable for a
 * first viability signal but noted as a limitation in the report.
 *
 * Run: npx tsx --env-file=.env scripts/spike/voice-search-spike.ts
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY not set. Run with: npx tsx --env-file=.env scripts/spike/voice-search-spike.ts');
  process.exit(1);
}

const AUDIO_DIR = join(import.meta.dirname, 'audio');
const MODEL_NAME = 'gemini-embedding-2';

interface Product {
  id: string;
  name: string;
  description: string;
}

// Real seed data from src/seed.ts — 8 of the 14 seeded products.
const products: Product[] = [
  {
    id: 'P1',
    name: 'Cà phê Phối Trộn Arabica Morning Mist',
    description:
      'Hỗn hợp Arabica êm dịu, cân bằng với hương vị sô-cô-la đen, caramel và một chút cam quýt. Hoàn hảo cho một buổi sáng thanh lành.',
  },
  {
    id: 'P4',
    name: 'Cà phê Robusta Espresso Đậm Đà',
    description:
      'Cà phê Robusta hàm lượng caffeine cao với hương vị đậm đà, crema dày mịn. Lý tưởng để pha cà phê sữa đá truyền Việt Nam.',
  },
  {
    id: 'P6',
    name: 'Cà phê Robusta Rang Bơ',
    description:
      'Cà phê Robusta rang bơ truyền thống của Việt Nam. Thơm ngậy, êm mượt và ngọt dịu — nền tảng kinh điển cho món cà phê sữa đá.',
  },
  {
    id: 'P7',
    name: 'Cà phê Ethiopian Yirgacheffe',
    description:
      'Cà phê Arabica Ethiopia sống động với nốt hương quả mọng và rượu vang. Hương thơm trà hoa phức hợp, làm bừng sáng mọi buổi sáng.',
  },
  {
    id: 'P8',
    name: 'Cà phê Colombian Geisha',
    description:
      'Giống cà phê Geisha quý hiếm từ Colombia với hương hoa cỏ và cam quýt đặc sắc. Dòng sản phẩm cao cấp được giới sành cà phê săn đón.',
  },
  {
    id: 'P10',
    name: 'Cà phê Kenya AA Peaberry',
    description:
      'Hạt cà phê Peaberry Kenya AA với độ chua sáng, hương vị lý chua đen và hương hoa quyến rũ. Một cực phẩm cà phê từ Châu Phi.',
  },
  {
    id: 'P11',
    name: 'Cà phê Ấn Độ Monsoon Malabar',
    description:
      'Cà phê Robusta phơi gió mùa độc đáo từ vùng Kerala, Ấn Độ. Độ chua cực thấp, đậm đà với thoảng hương gia vị và da thuộc.',
  },
  {
    id: 'P14',
    name: 'Cà phê Costa Rica Tarrazú',
    description:
      'Cà phê Arabica thung lũng Tarrazú với vị ngọt caramel, sô-cô-la và cam quýt dịu nhẹ. Độ chua cân bằng, hậu vị mượt mà.',
  },
];

interface Query {
  text: string;
  expectedProductId: string;
  kind: 'exact_name' | 'vague_description';
}

const queries: Query[] = [
  { text: 'Cho tôi cà phê Ethiopian Yirgacheffe', expectedProductId: 'P7', kind: 'exact_name' },
  { text: 'Tôi muốn mua cà phê Kenya A A Peaberry', expectedProductId: 'P10', kind: 'exact_name' },
  { text: 'Ở đây có cà phê Colombian Geisha không', expectedProductId: 'P8', kind: 'exact_name' },
  { text: 'Cho tôi một gói cà phê Costa Rica Tarrazu', expectedProductId: 'P14', kind: 'exact_name' },
  { text: 'Tôi muốn cà phê Robusta rang bơ truyền thống', expectedProductId: 'P6', kind: 'exact_name' },
  {
    text: 'Cho tôi loại cà phê nào có vị chua nhẹ giống rượu vang và hương hoa',
    expectedProductId: 'P7',
    kind: 'vague_description',
  },
  {
    text: 'Tôi thích cà phê đậm đà nhiều cafein để pha sữa đá',
    expectedProductId: 'P4',
    kind: 'vague_description',
  },
  {
    text: 'Cà phê nào thơm bơ béo ngậy kiểu truyền thống Việt Nam',
    expectedProductId: 'P6',
    kind: 'vague_description',
  },
  {
    text: 'Loại cà phê nào cao cấp hiếm và đắt tiền nhất ở đây',
    expectedProductId: 'P8',
    kind: 'vague_description',
  },
  {
    text: 'Tôi muốn cà phê ít chua đậm vị gia vị và da thuộc',
    expectedProductId: 'P11',
    kind: 'vague_description',
  },
  {
    text: 'Cà phê nào có vị caramel sô cô la và cam quýt nhẹ nhàng',
    expectedProductId: 'P14',
    kind: 'vague_description',
  },
  {
    text: 'Cho tôi loại cà phê cân bằng phù hợp uống vào buổi sáng',
    expectedProductId: 'P1',
    kind: 'vague_description',
  },
];

function synthesizeWav(text: string, outPath: string): void {
  const aiffPath = outPath.replace(/\.wav$/, '.aiff');
  execFileSync('say', ['-v', 'Linh', '-o', aiffPath, text]);
  execFileSync('afconvert', ['-f', 'WAVE', '-d', 'LEI16@24000', aiffPath, outPath]);
  rmSync(aiffPath);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function main(): Promise<void> {
  const genAI = new GoogleGenAI({ apiKey: apiKey! });

  console.log(`Embedding ${products.length} product documents with ${MODEL_NAME}...`);
  const productEmbeddings = new Map<string, number[]>();
  for (const product of products) {
    const doc = `title: ${product.name} | text: ${product.description}`;
    const result = await genAI.models.embedContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: doc }] }],
      config: { taskType: 'RETRIEVAL_DOCUMENT' },
    });
    productEmbeddings.set(product.id, result.embeddings![0]!.values!);
  }
  console.log(`Done. Embedding dimension: ${productEmbeddings.get(products[0]!.id)!.length}`);

  mkdirSync(AUDIO_DIR, { recursive: true });

  const results: Array<{
    query: string;
    kind: string;
    expected: string;
    top3: Array<{ productId: string; name: string; score: number }>;
    hit: boolean;
  }> = [];

  console.log(`\nSynthesizing + embedding ${queries.length} voice queries...\n`);
  for (const query of queries) {
    const wavPath = join(AUDIO_DIR, `${query.expectedProductId}-${query.kind}-${queries.indexOf(query)}.wav`);
    synthesizeWav(query.text, wavPath);
    const audioBase64 = readFileSync(wavPath).toString('base64');

    const result = await genAI.models.embedContent({
      model: MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [{ inlineData: { mimeType: 'audio/wav', data: audioBase64 } }],
        },
      ],
    });
    const queryEmbedding = result.embeddings![0]!.values!;

    const scored = products
      .map((p) => ({
        productId: p.id,
        name: p.name,
        score: cosineSimilarity(queryEmbedding, productEmbeddings.get(p.id)!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const hit = scored.some((s) => s.productId === query.expectedProductId);
    results.push({ query: query.text, kind: query.kind, expected: query.expectedProductId, top3: scored, hit });

    console.log(`[${hit ? 'HIT ' : 'MISS'}] (${query.kind}) "${query.text}"`);
    console.log(`  expected: ${query.expectedProductId}`);
    for (const s of scored) {
      console.log(`  - ${s.productId} ${s.name} (${s.score.toFixed(4)})`);
    }
    console.log('');
  }

  const hits = results.filter((r) => r.hit).length;
  const accuracy = (hits / results.length) * 100;
  const exactNameResults = results.filter((r) => r.kind === 'exact_name');
  const vagueResults = results.filter((r) => r.kind === 'vague_description');
  const exactAccuracy = (exactNameResults.filter((r) => r.hit).length / exactNameResults.length) * 100;
  const vagueAccuracy = (vagueResults.filter((r) => r.hit).length / vagueResults.length) * 100;

  console.log('='.repeat(60));
  console.log(`Overall top-3 accuracy: ${hits}/${results.length} (${accuracy.toFixed(1)}%)`);
  console.log(
    `  exact_name queries:        ${exactNameResults.filter((r) => r.hit).length}/${exactNameResults.length} (${exactAccuracy.toFixed(1)}%)`,
  );
  console.log(
    `  vague_description queries: ${vagueResults.filter((r) => r.hit).length}/${vagueResults.length} (${vagueAccuracy.toFixed(1)}%)`,
  );
  console.log('='.repeat(60));
  console.log(
    accuracy >= 65
      ? '\n=> Result OK (>= ~60-70% threshold from plan.md): proceed with Phase 1 audio-native as primary flow.'
      : '\n=> Result POOR (< ~60-70% threshold from plan.md): fall back to Phase 1b (STT -> embed text) as primary flow.',
  );

  const outputPath = join(import.meta.dirname, 'results.json');
  writeFileSync(
    outputPath,
    JSON.stringify({ model: MODEL_NAME, dimension: productEmbeddings.get(products[0]!.id)!.length, accuracy, exactAccuracy, vagueAccuracy, results }, null, 2),
  );
  console.log(`\nRaw results saved to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
