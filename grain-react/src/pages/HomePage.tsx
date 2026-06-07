import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Tag, ArrowRight } from 'lucide-react';
import { useStore } from '../store';

export const HomePage: React.FC = () => {
  const { workspaces, groups, tags } = useStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-200 py-12 px-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4">
          <LayoutDashboard size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">提示词管理工具</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          工作空间 — 词组 — 提示词解耦关联 · 多对多多级关系
        </p>
        <div className="flex justify-center gap-2 mt-4">
          <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent">AI 绘画</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent">Prompt 管理</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent">中间表关联</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent">多对多</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Concept Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10 text-accent mb-3">
              <LayoutDashboard size={18} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">工作空间</h3>
            <p className="text-xs text-gray-500">
              独立实体，通过中间表 <code className="text-[10px] font-mono">workspace_groups</code> 关联到组
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10 text-accent mb-3">
              <FolderOpen size={18} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">词组</h3>
            <p className="text-xs text-gray-500">
              独立实体，可关联到多个工作空间，通过 <code className="text-[10px] font-mono">group_tags</code> 关联提示词
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10 text-accent mb-3">
              <Tag size={18} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Tag（提示词）</h3>
            <p className="text-xs text-gray-500">
              包含 <code className="text-[10px] font-mono">en</code>、<code className="text-[10px] font-mono">zh</code>、<code className="text-[10px] font-mono">category</code>。独立实体，可加入多个组
            </p>
          </div>
        </div>

        {/* Junction Model */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 text-center">关联模型 — 中间表解耦</h3>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="px-4 py-2.5 rounded-lg bg-accent/10 text-accent font-semibold text-sm">
              工作空间
            </div>
            <div className="flex items-center gap-1.5 px-3 text-xs text-gray-400">
              <div className="w-8 h-px bg-gray-200" />
              <span>M:N</span>
              <div className="w-8 h-px bg-gray-200" />
            </div>
            <div className="px-3 py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400 font-mono">
              workspace_groups
            </div>
            <div className="flex items-center gap-1.5 px-3 text-xs text-gray-400">
              <div className="w-8 h-px bg-gray-200" />
              <span>M:N</span>
              <div className="w-8 h-px bg-gray-200" />
            </div>
            <div className="px-4 py-2.5 rounded-lg bg-green-100 text-green-700 font-semibold text-sm">
              词组
            </div>
            <div className="flex items-center gap-1.5 px-3 text-xs text-gray-400">
              <div className="w-8 h-px bg-gray-200" />
              <span>M:N</span>
              <div className="w-8 h-px bg-gray-200" />
            </div>
            <div className="px-3 py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400 font-mono">
              group_tags
            </div>
            <div className="flex items-center gap-1.5 px-3 text-xs text-gray-400">
              <div className="w-8 h-px bg-gray-200" />
              <span>M:N</span>
              <div className="w-8 h-px bg-gray-200" />
            </div>
            <div className="px-4 py-2.5 rounded-lg bg-orange-100 text-orange-700 font-semibold text-sm">
              Tag（提示词）
            </div>
          </div>
        </div>

        {/* Page Cards */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">原型页面</h2>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Link
            to={`/workspace/${workspaces[0]?.id || 'ws_main'}`}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-accent/50 transition-all group"
          >
            <div className="h-44 bg-gray-50 flex items-center justify-center border-b border-gray-200">
              <LayoutDashboard size={48} className="text-gray-300" />
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">工作空间概览</h3>
              <p className="text-xs text-gray-500 mb-2">
                多标签切换、新建工作空间。组分为正向词组/负面词组两类，各组 Tag 单词汇总展示，支持一键复制全部。
              </p>
              <span className="text-xs text-accent font-medium flex items-center gap-1">
                打开页面 <ArrowRight size={12} />
              </span>
            </div>
          </Link>

          <Link
            to={`/group/${groups[0]?.id || 'people'}`}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-accent/50 transition-all group"
          >
            <div className="h-44 bg-gray-50 flex items-center justify-center border-b border-gray-200">
              <FolderOpen size={48} className="text-gray-300" />
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">词组详情</h3>
              <p className="text-xs text-gray-500 mb-2">
                侧边栏支持目录和词组管理、按分类筛选提示词、双栏布局：左栏已选提示词+自定义输入，右栏按分类分组选择器。
              </p>
              <span className="text-xs text-accent font-medium flex items-center gap-1">
                打开页面 <ArrowRight size={12} />
              </span>
            </div>
          </Link>

          <Link
            to="/tags"
            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-accent/50 transition-all group"
          >
            <div className="h-44 bg-gray-50 flex items-center justify-center border-b border-gray-200">
              <Tag size={48} className="text-gray-300" />
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Tag 编辑器</h3>
              <p className="text-xs text-gray-500 mb-2">
                编辑 Tag 英文单词、中文释义、分类归属、多组关联管理。每个 Tag 包含 en/zh/category 三个字段。
              </p>
              <span className="text-xs text-accent font-medium flex items-center gap-1">
                打开页面 <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="bg-accent/10 rounded-xl p-5">
          <p className="text-sm text-gray-700">
            <strong>设计说明</strong> · 三个实体完全解耦，通过中间表{' '}
            <code className="text-xs font-mono">workspace_groups</code> 和{' '}
            <code className="text-xs font-mono">group_tags</code> 实现多对多关联。侧边栏分三区，每页展示关联上下文并支持动态建立/解除关系。
          </p>
          <div className="flex gap-6 mt-4 text-sm">
            <div>
              <span className="text-2xl font-bold text-accent">{workspaces.length}</span>
              <span className="text-gray-500 ml-1">工作空间</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-accent">{groups.length}</span>
              <span className="text-gray-500 ml-1">词组</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-accent">{tags.length}</span>
              <span className="text-gray-500 ml-1">提示词</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-5 border-t border-gray-200 text-xs text-gray-400">
        提示词管理工具 · 解耦关联模型 · 中间表关联 · 正向/负面词组
      </div>
    </div>
  );
};
