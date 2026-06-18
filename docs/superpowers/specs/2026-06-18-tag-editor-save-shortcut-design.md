# 提示词编辑页保存快捷键设计

## 目标

在提示词编辑页捕获 `Ctrl+S`，并兼容 macOS 的 `Cmd+S`，复用现有保存逻辑保存当前提示词。

## 行为

- 仅在提示词编辑页挂载快捷键监听。
- 用户按下 `Ctrl+S` 或 `Cmd+S` 时阻止浏览器“保存网页”的默认行为。
- 每次按键只调用一次现有保存函数，并显示一次“已保存”提示。
- 英文单词为空时保持现有行为，不执行保存。
- 页面卸载或依赖变化时移除旧监听，避免重复绑定。

## 实现

将保存函数用 `useCallback` 保持稳定，在 `useEffect` 中注册 `window.keydown` 监听。判断 `event.key.toLowerCase() === 's'` 且 `event.ctrlKey || event.metaKey` 后调用 `preventDefault()` 和保存函数。

## 验收

- 修改中文释义后按 `Ctrl+S`，页面显示一次“已保存”。
- 浏览器不弹出“保存网页”对话框。
- 保存按钮仍按原逻辑工作。
- ESLint、TypeScript 和 Vite 构建通过。
