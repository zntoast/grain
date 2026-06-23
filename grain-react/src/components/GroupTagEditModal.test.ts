import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), 'GroupTagEditModal.tsx');
const source = readFileSync(sourcePath, 'utf8');

test('custom prompt textarea is initialized from and persisted to the group', () => {
  assert.match(source, /const customInput = group\?\.customTags \|\| ''/);
  assert.match(source, /updateGroup\(groupId, \{ customTags: newValue \}\)/);
});
