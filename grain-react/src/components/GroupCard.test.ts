import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), 'GroupCard.tsx');
const source = readFileSync(sourcePath, 'utf8');

test('workspace group card resolves stored preview image ids before rendering', () => {
  assert.match(source, /import \{ loadImage \} from '\.\.\/services\/imageStorage'/);
  assert.match(source, /previewImageUrl\.startsWith\('img_'\)/);
  assert.match(source, /if \(previewImageUrl && cardRef\.current\)/);
  assert.match(source, /src=\{previewDisplayUrl\}/);
});
