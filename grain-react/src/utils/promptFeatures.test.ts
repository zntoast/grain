import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findDuplicateTagGroups,
  buildWorkspacePromptItems,
  createPromptOutput,
  formatWeightedPrompt,
  mergeTagReferences,
  moveItem,
  normalizePromptText,
  trimHistory,
} from './promptFeatures.ts';

test('normalizes duplicate prompt text across case and separators', () => {
  assert.equal(normalizePromptText(' Master_Piece '), 'masterpiece');
  assert.equal(normalizePromptText('master-piece'), 'masterpiece');
  assert.equal(normalizePromptText('master piece'), 'masterpiece');
});

test('groups duplicate tags by normalized english prompt', () => {
  const duplicates = findDuplicateTagGroups([
    { id: 'a', en: 'Master_Piece', zh: '杰作', category: '画质' },
    { id: 'b', en: 'master piece', zh: '杰作', category: '画质' },
    { id: 'c', en: 'cinematic', zh: '电影感', category: '画风' },
  ]);

  assert.deepEqual(duplicates.map((group) => group.map((tag) => tag.id)), [['a', 'b']]);
});

test('merges duplicate tag references without repeated ids', () => {
  assert.deepEqual(
    mergeTagReferences(['a', 'b', 'c', 'b'], 'a', ['b']),
    ['a', 'c'],
  );
});

test('formats weighted prompts only when weight differs from one', () => {
  assert.equal(formatWeightedPrompt('cinematic lighting', 1), 'cinematic lighting');
  assert.equal(formatWeightedPrompt('cinematic lighting', 1.2), '(cinematic lighting:1.2)');
});

test('moves prompt items while preserving all entries', () => {
  assert.deepEqual(moveItem(['a', 'b', 'c'], 2, 0), ['c', 'a', 'b']);
});

test('history keeps the newest thirty entries', () => {
  const history = Array.from({ length: 31 }, (_, index) => ({ id: String(index) }));
  assert.deepEqual(trimHistory(history).map((item) => item.id), history.slice(0, 30).map((item) => item.id));
});

test('builds stable prompt items and applies workspace order', () => {
  const items = buildWorkspacePromptItems({
    entries: [{ groupId: 'g1', type: 'positive' }],
    groups: [{ id: 'g1', name: '人物', desc: '', color: '', customTags: 'soft light' }],
    groupTags: { g1: ['t1', 't2'] },
    tags: [
      { id: 't1', en: '1girl', zh: '女孩', category: '角色' },
      { id: 't2', en: 'solo', zh: '单人', category: '构图' },
    ],
    promptOrder: ['g1:custom:0', 'g1:tag:t2'],
  });

  assert.deepEqual(items.map((item) => item.key), ['g1:custom:0', 'g1:tag:t2', 'g1:tag:t1']);
});

test('creates separate weighted outputs while respecting disabled groups and prompts', () => {
  const items = [
    { key: 'a', groupId: 'g1', groupName: '人物', type: 'positive' as const, prompt: '1girl', zh: '' },
    { key: 'b', groupId: 'g1', groupName: '人物', type: 'positive' as const, prompt: 'solo', zh: '' },
    { key: 'c', groupId: 'g2', groupName: '负面', type: 'negative' as const, prompt: 'blurry', zh: '' },
  ];
  const output = createPromptOutput(items, {
    disabledGroupIds: [],
    promptOrder: [],
    disabledPromptKeys: ['b'],
    weights: { a: 1.2 },
  });

  assert.equal(output.positiveText, '(1girl:1.2)');
  assert.equal(output.negativeText, 'blurry');
});
