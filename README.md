# Grain

Grain 是一款本地优先的 AI 绘画提示词管理工具，帮助创作者将零散的提示词整理成可复用、可组合的创作素材库。

[在线演示：https://www.cntoast.fun/](https://www.cntoast.fun/)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)

## 产品理念

Grain 使用“工作空间 → 词组 → 提示词”三级结构组织内容：

- **工作空间**：面向一个具体项目或创作主题。
- **词组**：可在不同工作空间复用的提示词集合。
- **提示词**：包含英文、中文释义和分类的最小内容单元。

工作空间与词组、词组与提示词均可灵活关联，调整组织方式时无需重复维护内容。

## 主要功能

- 创建和管理多个创作工作空间
- 按正向、负向类型组织词组
- 建立可跨工作空间复用的词组库
- 浏览、搜索和分类管理提示词
- 拖拽调整词组与提示词顺序
- 添加自定义提示词并快速编辑
- 汇总并一键复制当前提示词组合
- 网格视图与列表视图切换
- 图片预览与词组说明
- 可选显示 R18 分类
- JSON 数据导入与导出
- 本地文件自动同步

## 数据与隐私

Grain 默认将数据保存在用户自己的浏览器中，也支持由用户主动选择本地 JSON 文件进行同步。提示词、工作空间和图片等创作数据无需上传到远程服务。

## 技术栈

React、TypeScript、Vite、Zustand、React Router、Tailwind CSS、dnd-kit。

## License

MIT
