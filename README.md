# Grain — AI 绘画提示词管理器

本地优先的 AI 绘画提示词（Prompt）管理工具，帮助你将零散的提示词组织为结构化的工作空间 → 词组 → Tag 三级体系。

![](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)
![](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)

## 核心概念

```
工作空间 ──M:N── 词组 ──M:N── Tag（提示词）
```

| 层级 | 说明 | 示例 |
|------|------|------|
| **工作空间** | 顶层容器，对应一个创作项目 | "品牌设计素材"、"团队共享库" |
| **词组** | 提示词集合，分正向/负面两类 | "人物肖像"、"光影效果" |
| **Tag** | 最小单元，含英文/中文/分类 | `cinematic_lighting` / 电影布光 / 光影 |

三个实体完全解耦，通过中间表 `workspace_groups` 和 `group_tags` 实现多对多关联。同一个词组可出现在多个工作空间，同一个 Tag 可属于多个词组。

## 功能

- **工作空间管理** — 创建、切换、重命名；正向/负面词组分类展示
- **词组编辑** — 按分类浏览 Tag 库，点击即添加/移除；拖拽排序；自定义追加
- **Tag 库** — 内置 230+ 常用提示词，覆盖角色/画风/构图/光影/画质/场景/色调/表情/姿势/特效 10 个分类
- **侧边栏** — 目录树组织词组，双击重命名，右键菜单快速操作
- **布局切换** — 网格/行视图一键切换
- **一键复制** — 汇总正向提示词，直接粘贴到生图工具
- **数据持久化** — 自动保存到 localStorage；可选本地 JSON 文件自动同步（10 秒间隔可调）
- **鼠标特效** — 星芒/花火粒子效果（可关闭）

## 快速开始

```bash
git clone git@github.com:zntoast/grain.git
cd grain/grain-react
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。

## GitHub Actions 自动部署

推送代码到 `main` 分支后，GitHub Actions 会先运行测试和生产构建，全部通过后通过 SSH 登录物理服务器，并在 `/root/workspace/grain` 执行原生部署。该流程不使用 Docker。

服务器需要提前安装 Git、Node.js 22、npm、`serve`、`lsof`、`curl`、`flock` 和 `setsid`，并确保服务器自身能够拉取 GitHub 仓库。

在 GitHub 仓库的 Actions Secrets 中配置：

| Secret | 说明 |
| --- | --- |
| `DEPLOY_HOST` | 服务器 IP 或域名 |
| `DEPLOY_PORT` | SSH 端口 |
| `DEPLOY_USER` | SSH 用户 |
| `DEPLOY_SSH_KEY` | 对应服务器公钥的 SSH 私钥 |
| `DEPLOY_KNOWN_HOSTS` | 已确认的服务器 SSH 主机指纹 |

主机指纹可在可信环境中生成后填入 `DEPLOY_KNOWN_HOSTS`：

```bash
ssh-keyscan -p <SSH端口> <服务器地址>
```

也可以在服务器项目目录手动运行同一套部署逻辑：

```bash
make rs
```

## 数据管理

数据默认保存在浏览器 localStorage 中。如需持久化到本地文件：

1. 点击侧边栏底部 ⚙️ → 设置
2. 打开「本地文件自动同步」开关
3. 选择或创建本地 JSON 文件
4. 此后每 N 秒自动同步，关闭浏览器数据不丢失

也可通过设置 → 数据管理 → 导出 JSON 手动备份。

## 技术栈

- **React 19** + **TypeScript 6**
- **Zustand** — 全局状态管理
- **React Router v7** — 路由
- **@dnd-kit** — 拖拽排序
- **Tailwind CSS 4** — 样式
- **Vite 8** — 构建
- **File System Access API** — 本地文件读写

## 项目结构

```
grain-react/src/
├── components/        # 通用组件
│   ├── Sidebar.tsx    # 侧边栏导航
│   ├── Layout.tsx     # 布局容器
│   ├── Modal.tsx      # 弹窗
│   ├── Button.tsx     # 按钮
│   ├── TagChip.tsx    # Tag 标签
│   ├── SearchBox.tsx  # 搜索框
│   ├── SettingsModal.tsx    # 设置弹窗
│   ├── GroupTagEditModal.tsx # 词组标签编辑弹窗
│   ├── TagEditorModal.tsx   # Tag 编辑弹窗
│   ├── SyncToast.tsx        # 同步提示
│   ├── CursorEffects.tsx    # 鼠标特效
│   └── Toast.tsx            # 轻提示
├── pages/
│   ├── HomePage.tsx         # 首页
│   ├── WorkspacePage.tsx    # 工作空间
│   ├── GroupPage.tsx        # 词组详情
│   ├── AllTagsPage.tsx      # 全部提示词
│   └── TagEditorPage.tsx    # Tag 编辑页
├── services/
│   └── localDataFile.ts     # 本地文件读写
├── store.ts                 # Zustand Store
├── types.ts                 # 类型定义
└── constants.ts             # 默认数据 & 常量
```

## License

MIT
