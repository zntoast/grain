import test from 'node:test';
import assert from 'node:assert/strict';
import { filterVisibleCategories, filterVisibleTags, isR18Category } from './categoryVisibility.ts';

const tags = [
  { id: 'safe', en: 'masterpiece', zh: '杰作', category: '画质' },
  { id: 'adult', en: 'r18', zh: '成人', category: 'R18' },
];

test('hides R18 categories and tags when the setting is disabled', () => {
  assert.deepEqual(filterVisibleCategories(['画质', 'R18', '角色'], false), ['画质', '角色']);
  assert.deepEqual(filterVisibleTags(tags, false), [tags[0]]);
});

test('keeps R18 categories and tags when the setting is enabled', () => {
  assert.deepEqual(filterVisibleCategories(['画质', 'R18'], true), ['画质', 'R18']);
  assert.deepEqual(filterVisibleTags(tags, true), tags);
});

test('matches R18 category names exactly after trimming', () => {
  assert.equal(isR18Category(' R18 '), true);
  assert.equal(isR18Category('R18反提示'), false);
});
