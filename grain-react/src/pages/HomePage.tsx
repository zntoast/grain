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
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_22%_20%,rgba(248,199,216,.34),transparent_48%)]" />
        <div className="relative max-w-4xl mx-auto px-8 pt-14 pb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-[12px] bg-[#e85d91] flex items-center justify-center shadow-[0_2px_0_#bd3d70]">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-sm font-medium text-pink-400 tracking-wide">GRAIN</span>
          </div>
          
          <h1 className="text-[38px] font-bold text-gray-800 tracking-[-0.035em] leading-tight mb-3">
            AI 绘画<span className="text-pink-500">提示词管理</span>
          </h1>
          
          <p className="text-base text-gray-500 max-w-md leading-relaxed mb-6">
            将零散的提示词组织为结构化的工作空间。<br />
            灵活关联，一键复制，高效创作。
          </p>

          <Link
            to={`/workspace/${workspaces[0]?.id || 'ws_main'}`}
            className="control-press inline-flex items-center gap-2 h-11 px-5 bg-[#e85d91] text-white rounded-[11px] text-sm font-semibold hover:bg-[#d94d82] border border-[#e85d91] shadow-[0_2px_0_#bd3d70]"
          >
            开始使用
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-8 pb-16">
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
                className="surface-card card-hover group relative p-5"
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
