# Tag Editor Save Shortcut Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在提示词编辑页支持 `Ctrl+S` / `Cmd+S` 保存，并确保一次按键只触发一次保存。

**Architecture:** 用一个纯函数识别保存快捷键并通过 Node 内置测试覆盖；页面通过稳定的 `handleSave` 回调注册单个 `keydown` 监听。监听负责阻止浏览器默认行为并复用现有保存逻辑。

**Tech Stack:** React 19、TypeScript、Node test runner、Vite

---

### Task 1: 保存快捷键识别

**Files:**
- Create: `grain-react/src/utils/saveShortcut.ts`
- Create: `grain-react/src/utils/saveShortcut.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { isSaveShortcut } from './saveShortcut.ts';

test('recognizes Ctrl+S and Cmd+S only', () => {
  assert.equal(isSaveShortcut({ key: 's', ctrlKey: true, metaKey: false }), true);
  assert.equal(isSaveShortcut({ key: 'S', ctrlKey: false, metaKey: true }), true);
  assert.equal(isSaveShortcut({ key: 's', ctrlKey: false, metaKey: false }), false);
  assert.equal(isSaveShortcut({ key: 'x', ctrlKey: true, metaKey: false }), false);
});
```

- [ ] **Step 2: 验证测试失败**

Run: `node --test src/utils/saveShortcut.test.ts`
Expected: FAIL，因为 `saveShortcut.ts` 尚不存在。

- [ ] **Step 3: 写最小实现**

```ts
type SaveShortcutEvent = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey'>;

export const isSaveShortcut = (event: SaveShortcutEvent): boolean =>
  (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
```

- [ ] **Step 4: 验证测试通过**

Run: `node --test src/utils/saveShortcut.test.ts`
Expected: 1 test passed, 0 failed.

### Task 2: 提示词编辑页绑定保存

**Files:**
- Modify: `grain-react/src/pages/TagEditorPage.tsx`

- [ ] **Step 1: 稳定保存回调并绑定监听**

将 `handleSave` 改为 `useCallback`，然后注册：

```ts
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isSaveShortcut(event)) return;
    event.preventDefault();
    handleSave();
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleSave]);
```

- [ ] **Step 2: 运行静态验证**

Run: `npm run lint && npm run build`
Expected: 两条命令退出码为 0。

- [ ] **Step 3: 浏览器验证**

在 `/tag/t01` 修改中文释义后按一次 `Ctrl+S`。
Expected: 浏览器不弹出保存网页对话框，页面出现一次“已保存”提示。
