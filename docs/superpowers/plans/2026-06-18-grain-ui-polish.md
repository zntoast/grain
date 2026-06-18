# Grain UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Grain 的现有 React 界面统一升级为轻盈专业、圆润且具有明确按压反馈的粉色品牌工具界面，同时保持全部业务行为不变。

**Architecture:** 以 `src/index.css` 中的设计令牌和语义化工具类为视觉单一来源，通用组件负责统一控件状态，各页面只调整布局与语义类。改动限定在表现层，不引入新依赖，不修改 Zustand 数据流、路由或业务事件。

**Tech Stack:** React 19、TypeScript、Tailwind CSS 4、Lucide React、Vite

---

### Task 1: 建立全局设计令牌和交互基础

**Files:**
- Modify: `grain-react/src/index.css`
- Modify: `grain-react/src/App.css`

- [ ] **Step 1: 记录基线构建与 lint 状态**

Run: `cd grain-react && npm run build && npm run lint`

Expected: 两条命令退出码为 0；若存在历史错误，记录后只处理与本次改动相关的错误。

- [ ] **Step 2: 建立全局视觉令牌**

在 `@theme` 和 `@layer base` 中定义暖白背景、石墨文本、柔和边框、玫粉主色、语义色、10–14px 圆角、三档阴影和统一 focus ring。为 `button`、`a`、`input`、`select`、`textarea` 增加一致的 `focus-visible` 与禁用状态。

- [ ] **Step 3: 增加参考站风格的轻量交互类**

新增 `.control-press`、`.icon-control`、`.surface-card`、`.page-header`、`.filter-chip`、`.filter-chip-active`、`.form-control`：

```css
.control-press {
  transform: translateY(0);
  transition: transform 180ms cubic-bezier(.2,.8,.2,1), box-shadow 180ms ease;
}
.control-press:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: none;
}
.icon-control {
  width: 34px;
  height: 34px;
  border-radius: 10px;
}
```

- [ ] **Step 4: 删除无引用的 Vite 脚手架样式**

将 `src/App.css` 收敛为空或仅保留仍被 `App.tsx` 引用的规则；通过 `rg "counter|hero|next-steps|spacer|ticks" grain-react/src` 确认删除项无引用。

- [ ] **Step 5: 验证全局样式可编译**

Run: `cd grain-react && npm run build`

Expected: TypeScript 和 Vite 构建均成功。

### Task 2: 统一通用控件、图标和卡片

**Files:**
- Modify: `grain-react/src/components/Button.tsx`
- Modify: `grain-react/src/components/Modal.tsx`
- Modify: `grain-react/src/components/SearchBox.tsx`
- Modify: `grain-react/src/components/TagChip.tsx`
- Modify: `grain-react/src/components/GroupCard.tsx`
- Modify: `grain-react/src/components/Layout.tsx`

- [ ] **Step 1: 重构 Button 的视觉状态**

保留现有 props 和 variant API，将基础样式统一为 10–12px 圆角、`control-press`、清晰的 hover/active/focus/disabled 状态。主按钮使用玫粉色和 2px 柔和底部阴影；secondary 使用暖白底；danger 保留红色语义；gradient 降低紫色占比。

- [ ] **Step 2: 统一 Modal 与 SearchBox**

Modal 使用 14px 圆角、柔和遮罩和进入动画；关闭按钮改为 34px `icon-control` 并加 `aria-label="关闭"`。SearchBox 使用 `.form-control` 边框和 focus-within 状态，清除按钮使用 28px 热区并加 `aria-label="清空搜索"`。

- [ ] **Step 3: 优化 TagChip**

保留胶囊形，但将未选中边框从 2px 降为 1px；选中态使用浅粉背景、深粉文字和粉色边框，不再整块实心粉。移除按钮使用 Lucide `X` 或明确的 20px 点击热区和 `aria-label`。

- [ ] **Step 4: 优化 GroupCard 和布局分隔条**

将米色卡片改为暖白 `.surface-card`，统一 header/footer 分隔、开关、状态分段控件和危险操作。布局拖拽条保持逻辑不变，默认显示 1px 淡边并在 hover/drag 时显示主色。

- [ ] **Step 5: 验证组件类型与 lint**

Run: `cd grain-react && npm run lint && npm run build`

Expected: 退出码为 0，无新增 ESLint 或 TypeScript 错误。

### Task 3: 统一侧边栏和主要页面层级

**Files:**
- Modify: `grain-react/src/components/Sidebar.tsx`
- Modify: `grain-react/src/pages/HomePage.tsx`
- Modify: `grain-react/src/pages/WorkspacePage.tsx`
- Modify: `grain-react/src/pages/GroupPage.tsx`
- Modify: `grain-react/src/pages/AllTagsPage.tsx`
- Modify: `grain-react/src/pages/TagEditorPage.tsx`

- [ ] **Step 1: 优化侧边栏**

统一 34px 导航热区、14–16px 图标、10px 圆角和浅粉选中态；减少装饰圆点与渐变面积，保留目录拖拽、折叠和右键菜单行为。

- [ ] **Step 2: 优化首页**

收紧 Hero 宽度和垂直留白；主 CTA 应用新的 Button 视觉语言；三张统计卡使用 `.surface-card`，图标容器 40px、图标 18px，并增加轻微 hover 位移。

- [ ] **Step 3: 优化工作空间与词组详情**

将页头、统计卡、筛选器、汇总区、上传区和文本区统一到新的背景/边框/圆角体系；只替换 className，不改事件、状态或条件渲染。

- [ ] **Step 4: 优化全部提示词与编辑页**

分类筛选器使用 `.filter-chip`，选中态使用浅粉；长标签列表增加清晰的分组间距和 `content-visibility: auto`；编辑表单统一 `.form-control` 和 `.surface-card`。

- [ ] **Step 5: 检查无障碍与交互一致性**

使用 `rg "<button" grain-react/src/components grain-react/src/pages` 检查纯图标按钮，补充缺失的 `title` 或 `aria-label`；确认所有 Lucide 图标使用 14/16/18/20px 档位。

### Task 4: 浏览器视觉验收与回归验证

**Files:**
- Modify: 仅修复验收中发现的相关表现层文件

- [ ] **Step 1: 启动开发服务器**

Run: `cd grain-react && npm run dev -- --host 127.0.0.1`

Expected: Vite 输出可访问的本地地址。

- [ ] **Step 2: 逐页视觉检查**

在 1440×900 左右桌面视口检查：首页、首个工作空间、首个词组、全部提示词、提示词编辑页以及至少一个弹窗。确认无横向溢出、文字裁切、控件重叠或明显视觉断层。

- [ ] **Step 3: 交互抽查**

验证侧边栏折叠、按钮按压、分类筛选、搜索输入、标签选择、弹窗打开/关闭和工作空间卡片 hover。只验证现有行为，不产生不可逆数据修改。

- [ ] **Step 4: 完整验证**

Run: `cd grain-react && npm run lint && npm run build`

Expected: 两条命令退出码均为 0。

- [ ] **Step 5: 检查改动范围**

Run: `git diff --check && git status --short`

Expected: 无空白错误；只包含本计划列出的表现层文件、计划文档及规格文档。
