import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Tag, ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../store';

export const HomePage: React.FC = () => {
  const { workspaces, groups, tags } = useStore();

  const features = [
    {
      icon: LayoutDashboard,
      title: '工作空间',
      desc: '按项目组织提示词，正向/负面分组管理',
      link: `/workspace/${workspaces[0]?.id || 'ws_main'}`,
      color: 'accent',
      count: workspaces.length,
    },
    {
      icon: FolderOpen,
      title: '词组',
      desc: '灵活的提示词集合，支持多工作空间复用',
      link: `/group/${groups[0]?.id || 'people'}`,
      color: 'green',
      count: groups.length,
    },
    {
      icon: Tag,
      title: '提示词库',
      desc: '230+ 内置提示词，覆盖 10 个分类',
      link: '/tags',
      color: 'orange',
      count: tags.length,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/50 via-white to-purple-50/30">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/30 via-transparent to-purple-100/20" />
        <div className="relative max-w-5xl mx-auto px-8 pt-16 pb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center shadow-sm">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-sm font-medium text-pink-400 tracking-wide">GRAIN</span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight leading-tight mb-3">
            AI 绘画<span className="text-pink-500">提示词管理</span>
          </h1>
          
          <p className="text-base text-gray-500 max-w-md leading-relaxed mb-6">
            将零散的提示词组织为结构化的工作空间。<br />
            灵活关联，一键复制，高效创作。
          </p>

          <Link
            to={`/workspace/${workspaces[0]?.id || 'ws_main'}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-pink-400 text-white rounded-xl text-sm font-medium hover:from-pink-600 hover:to-pink-500 transition-all shadow-sm"
          >
            开始使用
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            const colorMap = {
              accent: { bg: 'bg-pink-50', text: 'text-pink-500', border: 'border-pink-100' },
              green: { bg: 'bg-purple-50', text: 'text-purple-500', border: 'border-purple-100' },
              orange: { bg: 'bg-indigo-50', text: 'text-indigo-500', border: 'border-indigo-100' },
            };
            const colors = colorMap[feature.color as keyof typeof colorMap];
            
            return (
              <Link
                key={feature.title}
                to={feature.link}
                className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:border-pink-200 hover:shadow-md transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-3`}>
                  <Icon size={18} className={colors.text} />
                </div>
                
                <h3 className="text-sm font-semibold text-gray-800 mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{feature.desc}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-800">{feature.count}</span>
                  <span className={`text-xs font-medium ${colors.text} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    打开 <ArrowRight size={10} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-10 flex items-center justify-center gap-6 text-xs text-gray-400">
          <span>{workspaces.length} 个工作空间</span>
          <span className="w-px h-3 bg-pink-200" />
          <span>{groups.length} 个词组</span>
          <span className="w-px h-3 bg-pink-200" />
          <span>{tags.length} 个提示词</span>
        </div>
      </div>
    </div>
  );
};
