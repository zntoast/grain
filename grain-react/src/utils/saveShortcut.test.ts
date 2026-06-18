import test from 'node:test';
import assert from 'node:assert/strict';
import { isSaveShortcut } from './saveShortcut.ts';

test('recognizes Ctrl+S and Cmd+S only', () => {
  assert.equal(isSaveShortcut({ key: 's', ctrlKey: true, metaKey: false }), true);
  assert.equal(isSaveShortcut({ key: 'S', ctrlKey: false, metaKey: true }), true);
  assert.equal(isSaveShortcut({ key: 's', ctrlKey: false, metaKey: false }), false);
  assert.equal(isSaveShortcut({ key: 'x', ctrlKey: true, metaKey: false }), false);
  assert.equal(
    isSaveShortcut({ key: 's', ctrlKey: true, metaKey: false, repeat: true }),
    false,
  );
});
