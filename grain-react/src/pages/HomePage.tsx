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
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-purple-500/[0.03]" />
        <div className="relative max-w-5xl mx-auto px-8 pt-20 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-sm">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-400 tracking-wide uppercase">Grain</span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
            AI 绘画<br />
            <span className="text-accent">提示词管理</span>
          </h1>
          
          <p className="text-lg text-gray-500 max-w-lg leading-relaxed mb-8">
            将零散的提示词组织为结构化的工作空间。<br />
            灵活关联，一键复制，高效创作。
          </p>

          <Link
            to={`/workspace/${workspaces[0]?.id || 'ws_main'}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            开始使用
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            const colorMap = {
              accent: { bg: 'bg-accent/[0.08]', text: 'text-accent', border: 'border-accent/20' },
              green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
              orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
            };
            const colors = colorMap[feature.color as keyof typeof colorMap];
            
            return (
              <Link
                key={feature.title}
                to={feature.link}
                className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                  <Icon size={20} className={colors.text} />
                </div>
                
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{feature.desc}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">{feature.count}</span>
                  <span className={`text-xs font-medium ${colors.text} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    打开 <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
          <span>{workspaces.length} 个工作空间</span>
          <span className="w-px h-3 bg-gray-200" />
          <span>{groups.length} 个词组</span>
          <span className="w-px h-3 bg-gray-200" />
          <span>{tags.length} 个提示词</span>
        </div>
      </div>
    </div>
  );
};
