import React, { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  X,
  Copy,
  FolderOpen,
} from 'lucide-react';
import { useStore } from '../store';
import { Layout, Button, Modal, SearchBox, TagChip, useToast, Toast } from '../components';
import { COLOR_OPTIONS } from '../constants';

export const WorkspacePage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const {
    workspaces,
    groups,
    tags,
    workspaceGroups,
    groupTags,
    addWorkspace,
    deleteWorkspace,
    linkGroupToWorkspace,
    unlinkGroupFromWorkspace,
    setGroupType,
    updateWorkspaceGroupOrder,
  } = useStore();

  const [viewType, setViewType] = useState<'positive' | 'negative' | 'all'>('positive');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [newWorkspaceColor, setNewWorkspaceColor] = useState(COLOR_OPTIONS[0]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dropOverGroupId, setDropOverGroupId] = useState<string | null>(null);

  // 当前工作空间
  const workspace = workspaces.find((ws) => ws.id === workspaceId);

  // 当前工作空间的词组列表
  const workspaceGroupEntries = workspaceId ? workspaceGroups[workspaceId] || [] : [];

  // 按类型筛选词组
  const filteredGroups = useMemo(() => {
    let entries = workspaceGroupEntries;
    if (viewType !== 'all') {
      entries = entries.filter((e) => e.type === viewType);
    }
    return entries
      .map((e) => ({ group: groups.find((g) => g.id === e.groupId), type: e.type }))
      .filter((item) => item.group)
      .filter((item) =>
        searchQuery
          ? item.group!.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.group!.desc.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      );
  }, [workspaceGroupEntries, viewType, groups, searchQuery]);

  // 汇总所有提示词
  const allTags = useMemo(() => {
    const tagIds = new Set<string>();
    filteredGroups.forEach((item) => {
      if (item.group) {
        (groupTags[item.group.id] || []).forEach((tagId) => tagIds.add(tagId));
      }
    });
    return Array.from(tagIds)
      .map((tagId) => tags.find((t) => t.id === tagId))
      .filter(Boolean);
  }, [filteredGroups, groupTags, tags]);

  // 统计数据
  const stats = useMemo(() => {
    const positiveEntries = workspaceGroupEntries.filter((e) => e.type === 'positive');
    const negativeEntries = workspaceGroupEntries.filter((e) => e.type === 'negative');
    const allTagIds = new Set<string>();
    
    workspaceGroupEntries.forEach((e) => {
      (groupTags[e.groupId] || []).forEach((tagId) => allTagIds.add(tagId));
    });
    
    return {
      groupCount: workspaceGroupEntries.length,
      positiveCount: positiveEntries.length,
      negativeCount: negativeEntries.length,
      tagCount: allTagIds.size,
      workspaceCount: workspaces.length,
    };
  }, [workspaceGroupEntries, groupTags, workspaces]);

  // 获取词组的所有标签
  const getGroupTags = (groupId: string) => {
    const tagIds = groupTags[groupId] || [];
    return tagIds
      .map((tagId) => tags.find((t) => t.id === tagId))
      .filter(Boolean);
  };

  // 复制全部提示词
  const handleCopyAll = () => {
    const text = allTags.map((t) => t!.en).join(', ');
    navigator.clipboard.writeText(text);
    showToast('已复制全部提示词');
  };

  // 创建工作空间
  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) return;
    const ws = addWorkspace({
      name: newWorkspaceName.trim(),
      desc: newWorkspaceDesc.trim(),
      color: newWorkspaceColor,
    });
    setShowCreateModal(false);
    setNewWorkspaceName('');
    setNewWorkspaceDesc('');
    setNewWorkspaceColor(COLOR_OPTIONS[0]);
    navigate(`/workspace/${ws.id}`);
  };

  // 删除工作空间
  const handleDeleteWorkspace = (wsId: string) => {
    const ws = workspaces.find((w) => w.id === wsId);
    if (!ws) return;
    if (confirm(`确定删除工作空间「${ws.name}」？关联关系将被移除，但组和提示词数据不受影响。`)) {
      deleteWorkspace(wsId);
      if (wsId === workspaceId) {
        const nextWs = workspaces.find((w) => w.id !== wsId);
        if (nextWs) {
          navigate(`/workspace/${nextWs.id}`);
        } else {
          navigate('/');
        }
      }
    }
  };

  // 关联词组
  const handleLinkGroups = () => {
    if (!workspaceId) return;
    selectedGroups.forEach((groupId) => {
      linkGroupToWorkspace(workspaceId, groupId, viewType);
    });
    setShowLinkModal(false);
    setSelectedGroups([]);
  };

  // 切换词组类型
  const handleToggleGroupType = (groupId: string) => {
    if (!workspaceId) return;
    const entry = workspaceGroupEntries.find((e) => e.groupId === groupId);
    if (entry) {
      const newType = entry.type === 'positive' ? 'negative' : 'positive';
      setGroupType(workspaceId, groupId, newType);
    }
  };

  // 切换视图模式
  const handleChangeGroupType = (groupId: string, newType: 'positive' | 'negative') => {
    if (!workspaceId) return;
    const entry = workspaceGroupEntries.find((e) => e.groupId === groupId);
    if (entry && entry.type !== newType) {
      setGroupType(workspaceId, groupId, newType);
    }
  };

  // 解除关联
  const handleUnlinkGroup = (groupId: string) => {
    if (!workspaceId) return;
    if (confirm('确定解除该组与此工作空间的关联？组本身和组内提示词不会被删除。')) {
      unlinkGroupFromWorkspace(workspaceId, groupId);
    }
  };

  // 拖拽处理
  const handleDragStart = (e: React.DragEvent, groupId: string) => {
    setDraggedGroupId(groupId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', groupId);
  };

  const handleDragEnd = () => {
    setDraggedGroupId(null);
    setDropOverGroupId(null);
  };

  const handleDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    if (draggedGroupId && draggedGroupId !== groupId) {
      setDropOverGroupId(groupId);
    }
  };

  const handleDragLeave = () => {
    setDropOverGroupId(null);
  };

  const handleDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    if (!workspaceId || !draggedGroupId || draggedGroupId === targetGroupId) return;
    
    const draggedIndex = workspaceGroupEntries.findIndex((e) => e.groupId === draggedGroupId);
    const targetIndex = workspaceGroupEntries.findIndex((e) => e.groupId === targetGroupId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      updateWorkspaceGroupOrder(workspaceId, draggedGroupId, targetIndex);
    }
    
    setDraggedGroupId(null);
    setDropOverGroupId(null);
  };

  // 可关联的词组（未关联的）
  const availableGroups = useMemo(() => {
    const linkedIds = new Set(workspaceGroupEntries.map((e) => e.groupId));
    return groups.filter((g) => !linkedIds.has(g.id));
  }, [groups, workspaceGroupEntries]);

  if (!workspace) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">工作空间不存在</p>
            <Button onClick={() => navigate('/')}>返回首页</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-gray-200 flex items-center gap-3 px-6 bg-white flex-shrink-0">
          <h2 className="text-base font-semibold tracking-tight">{workspace.name}</h2>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 h-8 w-60">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-40">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="搜索组名…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-none bg-transparent text-sm flex-1 outline-none min-w-0 text-gray-900 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button className="h-9 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                关联词组
              </button>
            </div>
          </div>
        </header>

        {/* Workspace Tabs */}
        <div className="h-11 border-b border-gray-200 flex items-center gap-1 px-6 bg-white flex-shrink-0">
          {workspaces.map((ws) => {
            const isActive = ws.id === workspaceId;
            return (
              <button
                key={ws.id}
                onClick={() => navigate(`/workspace/${ws.id}`)}
                className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-t-md text-sm font-medium relative transition-colors ${
                  isActive
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: isActive ? '#fff' : `oklch(58% 0.18 ${ws.color})` }}
                />
                {ws.name}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-sm"
                    style={{ background: 'oklch(58% 0.18 255)' }}
                  />
                )}
                {workspaces.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWorkspace(ws.id);
                    }}
                    className="w-4 h-4 rounded text-xs opacity-0 group-hover:opacity-100 ml-0.5 hover:bg-gray-200 flex items-center justify-center"
                    style={{ opacity: undefined }}
                  >
                    ×
                  </button>
                )}
              </button>
            );
          })}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-8 h-8 rounded-md border border-dashed border-gray-300 bg-transparent text-gray-400 cursor-pointer text-base flex items-center justify-center hover:bg-gray-50 hover:text-gray-600 hover:border-gray-400 ml-1 flex-shrink-0"
          >
            +
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Page Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight leading-tight">{workspace.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {workspace.desc} · 关联 {stats.groupCount} 个词组 · <code className="text-xs px-1.5 py-0.5 rounded bg-gray-100 font-mono">workspace_groups</code>
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">关联词组数</div>
              <div className="text-2xl font-semibold tracking-tight font-variant-numeric tabular-nums">{stats.groupCount}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">涉及提示词</div>
              <div className="text-2xl font-semibold tracking-tight font-variant-numeric tabular-nums">{stats.tagCount}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">工作空间总数</div>
              <div className="text-2xl font-semibold tracking-tight font-variant-numeric tabular-nums">{stats.workspaceCount}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">导出次数</div>
              <div className="text-2xl font-semibold tracking-tight font-variant-numeric tabular-nums">0</div>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex gap-0.5 mb-6 p-0.5 bg-white border border-gray-200 rounded-xl w-fit">
            <button
              onClick={() => setViewType('all')}
              className={`px-4 py-1.5 rounded-lg border-none text-sm cursor-pointer font transition-all ${
                viewType === 'all'
                  ? 'bg-accent text-white font-medium'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setViewType('positive')}
              className={`px-4 py-1.5 rounded-lg border-none text-sm cursor-pointer font transition-all ${
                viewType === 'positive'
                  ? 'bg-accent text-white font-medium'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              正向词组
            </button>
            <button
              onClick={() => setViewType('negative')}
              className={`px-4 py-1.5 rounded-lg border-none text-sm cursor-pointer font transition-all ${
                viewType === 'negative'
                  ? 'bg-accent text-white font-medium'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              负面词组
            </button>
          </div>

          {/* Group Section */}
          {viewType === 'all' ? (
            // 全部视图：分别展示正向和负面词组
            <>
              {/* 正向词组区块 */}
              <div className="mb-7">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    正向词组
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                      {filteredGroups.filter(g => g.type === 'positive').length} 个词组
                    </span>
                  </h3>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
                  <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                    <span>正向提示词汇总（{filteredGroups.filter(g => g.type === 'positive').reduce((acc, g) => acc + (groupTags[g.group!.id] || []).length, 0)} 个词）</span>
                    <button
                      onClick={() => {
                        const positiveTagIds = filteredGroups.filter(g => g.type === 'positive').flatMap(g => groupTags[g.group!.id] || []);
                        const positiveTags = positiveTagIds.map(id => tags.find(t => t.id === id)!.en).join(', ');
                        navigator.clipboard.writeText(positiveTags);
                        showToast('已复制正向提示词');
                      }}
                      className="bg-none border-none text-accent cursor-pointer text-xs px-1.5 py-0.5 rounded hover:bg-accent/10"
                    >
                      复制全部
                    </button>
                  </div>
                  <div className="p-2.5 font-mono text-xs leading-relaxed text-gray-900 min-h-12 max-h-48 overflow-y-auto">
                    {filteredGroups.filter(g => g.type === 'positive').map((item) => {
                      const group = item.group!;
                      const groupTagsList = getGroupTags(group.id);
                      if (groupTagsList.length === 0) return null;
                      return (
                        <span key={group.id} className="inline">
                          <span className="text-gray-300 mx-0.5">, </span>
                          <span className={`transition-colors ${hoveredGroupId === group.id ? 'bg-yellow-100 px-1 rounded' : ''}`}>
                            {groupTagsList.map((t) => t!.en).join(', ')}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {filteredGroups.filter(g => g.type === 'positive').length > 0 ? (
                    filteredGroups.filter(g => g.type === 'positive').map((item) => {
                      const group = item.group!;
                      const groupTagsList = getGroupTags(group.id);
                      const isDragging = draggedGroupId === group.id;
                      const isDropOver = dropOverGroupId === group.id;
                      return (
                        <div
                          key={group.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, group.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, group.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, group.id)}
                          onMouseEnter={() => setHoveredGroupId(group.id)}
                          onMouseLeave={() => setHoveredGroupId(null)}
                          className={`bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-grab ${isDragging ? 'opacity-50' : ''} ${isDropOver ? 'border-accent border-2' : ''}`}
                        >
                          <div className="px-4 pt-4 flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 cursor-grab select-none">⠿</span>
                              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">正向</span>
                              <h4 className="text-sm font-semibold tracking-tight">{group.name}</h4>
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">{groupTagsList.length} 个词</span>
                          </div>
                          <p className="text-xs text-gray-500 px-4 pt-1.5 leading-relaxed">{group.desc}</p>
                          <div className="px-4 pt-3 pb-2 flex justify-between items-center border-t border-gray-100 mt-3">
                            <Link to={`/group/${group.id}`} className="text-xs text-accent hover:underline">管理提示词 →</Link>
                            <div className="flex gap-1.5 items-center">
                              <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-md">
                                <button className="px-2.5 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">正向</button>
                                <button onClick={() => handleChangeGroupType(group.id, 'negative')} className="px-2.5 py-0.5 rounded text-xs text-gray-500 hover:text-red-600">负向</button>
                              </div>
                              <button onClick={() => handleUnlinkGroup(group.id)} className="h-7 px-2.5 rounded-md border text-xs text-red-500 border-red-200 bg-transparent hover:bg-red-50">解除关联</button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
                      <p className="text-gray-500 text-sm">暂无正向词组。</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 负面词组区块 */}
              <div className="mb-7">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    负面词组
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                      {filteredGroups.filter(g => g.type === 'negative').length} 个词组
                    </span>
                  </h3>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
                  <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                    <span>负面提示词汇总（{filteredGroups.filter(g => g.type === 'negative').reduce((acc, g) => acc + (groupTags[g.group!.id] || []).length, 0)} 个词）</span>
                    <button
                      onClick={() => {
                        const negativeTagIds = filteredGroups.filter(g => g.type === 'negative').flatMap(g => groupTags[g.group!.id] || []);
                        const negativeTags = negativeTagIds.map(id => tags.find(t => t.id === id)!.en).join(', ');
                        navigator.clipboard.writeText(negativeTags);
                        showToast('已复制负面提示词');
                      }}
                      className="bg-none border-none text-accent cursor-pointer text-xs px-1.5 py-0.5 rounded hover:bg-accent/10"
                    >
                      复制全部
                    </button>
                  </div>
                  <div className="p-2.5 font-mono text-xs leading-relaxed text-gray-900 min-h-12 max-h-48 overflow-y-auto">
                    {filteredGroups.filter(g => g.type === 'negative').map((item) => {
                      const group = item.group!;
                      const groupTagsList = getGroupTags(group.id);
                      if (groupTagsList.length === 0) return null;
                      return (
                        <span key={group.id} className="inline">
                          <span className="text-gray-300 mx-0.5">, </span>
                          <span className={`transition-colors ${hoveredGroupId === group.id ? 'bg-yellow-100 px-1 rounded' : ''}`}>
                            {groupTagsList.map((t) => t!.en).join(', ')}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {filteredGroups.filter(g => g.type === 'negative').length > 0 ? (
                    filteredGroups.filter(g => g.type === 'negative').map((item) => {
                      const group = item.group!;
                      const groupTagsList = getGroupTags(group.id);
                      const isDragging = draggedGroupId === group.id;
                      const isDropOver = dropOverGroupId === group.id;
                      return (
                        <div
                          key={group.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, group.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, group.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, group.id)}
                          onMouseEnter={() => setHoveredGroupId(group.id)}
                          onMouseLeave={() => setHoveredGroupId(null)}
                          className={`bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-grab ${isDragging ? 'opacity-50' : ''} ${isDropOver ? 'border-accent border-2' : ''}`}
                        >
                          <div className="px-4 pt-4 flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 cursor-grab select-none">⠿</span>
                              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700">负面</span>
                              <h4 className="text-sm font-semibold tracking-tight">{group.name}</h4>
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">{groupTagsList.length} 个词</span>
                          </div>
                          <p className="text-xs text-gray-500 px-4 pt-1.5 leading-relaxed">{group.desc}</p>
                          <div className="px-4 pt-3 pb-2 flex justify-between items-center border-t border-gray-100 mt-3">
                            <Link to={`/group/${group.id}`} className="text-xs text-accent hover:underline">管理提示词 →</Link>
                            <div className="flex gap-1.5 items-center">
                              <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-md">
                                <button onClick={() => handleChangeGroupType(group.id, 'positive')} className="px-2.5 py-0.5 rounded text-xs text-gray-500 hover:text-green-600">正向</button>
                                <button className="px-2.5 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium">负向</button>
                              </div>
                              <button onClick={() => handleUnlinkGroup(group.id)} className="h-7 px-2.5 rounded-md border text-xs text-red-500 border-red-200 bg-transparent hover:bg-red-50">解除关联</button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
                      <p className="text-gray-500 text-sm">暂无负面词组。</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // 单类型视图（正向或负面）
            <div className="mb-7">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  {viewType === 'positive' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  )}
                  {viewType === 'positive' ? '正向词组' : '负面词组'}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${viewType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {filteredGroups.length} 个词组
                  </span>
                </h3>
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="h-9 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  关联{viewType === 'positive' ? '正向' : '负面'}词组
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
                <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                  <span>{viewType === 'positive' ? '正向' : '负面'}提示词汇总（{allTags.length} 个词）</span>
                  <button onClick={handleCopyAll} className="bg-none border-none text-accent cursor-pointer text-xs px-1.5 py-0.5 rounded hover:bg-accent/10">
                    复制全部
                  </button>
                </div>
                <div className="p-2.5 font-mono text-xs leading-relaxed text-gray-900 min-h-12 max-h-48 overflow-y-auto">
                  {filteredGroups.map((item) => {
                    const group = item.group!;
                    const groupTagsList = getGroupTags(group.id);
                    if (groupTagsList.length === 0) return null;
                    return (
                      <span key={group.id} className="inline">
                        <span className="text-gray-300 mx-0.5">, </span>
                        <span className={`transition-colors ${hoveredGroupId === group.id ? 'bg-yellow-100 px-1 rounded' : ''}`}>
                          {groupTagsList.map((t) => t!.en).join(', ')}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {filteredGroups.length > 0 ? (
                  filteredGroups.map((item) => {
                    const group = item.group!;
                    const groupTagsList = getGroupTags(group.id);
                    const isDragging = draggedGroupId === group.id;
                    const isDropOver = dropOverGroupId === group.id;
                    return (
                      <div
                        key={group.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, group.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, group.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, group.id)}
                        onMouseEnter={() => setHoveredGroupId(group.id)}
                        onMouseLeave={() => setHoveredGroupId(null)}
                        className={`bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-grab ${isDragging ? 'opacity-50' : ''} ${isDropOver ? 'border-accent border-2' : ''}`}
                      >
                        <div className="px-4 pt-4 flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 cursor-grab select-none">⠿</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${viewType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {viewType === 'positive' ? '正向' : '负面'}
                            </span>
                            <h4 className="text-sm font-semibold tracking-tight">{group.name}</h4>
                          </div>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">{groupTagsList.length} 个词</span>
                        </div>
                        <p className="text-xs text-gray-500 px-4 pt-1.5 leading-relaxed">{group.desc}</p>
                        <div className="px-4 pt-3 pb-2 flex justify-between items-center border-t border-gray-100 mt-3">
                          <Link to={`/group/${group.id}`} className="text-xs text-accent hover:underline">管理提示词 →</Link>
                          <div className="flex gap-1.5 items-center">
                            <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-md">
                              <button
                                onClick={() => handleChangeGroupType(group.id, 'positive')}
                                className={`px-2.5 py-0.5 rounded text-xs ${viewType === 'positive' ? 'bg-green-100 text-green-700 font-medium' : 'text-gray-500 hover:text-green-600'}`}
                              >
                                正向
                              </button>
                              <button
                                onClick={() => handleChangeGroupType(group.id, 'negative')}
                                className={`px-2.5 py-0.5 rounded text-xs ${viewType === 'negative' ? 'bg-red-100 text-red-700 font-medium' : 'text-gray-500 hover:text-red-600'}`}
                              >
                                负向
                              </button>
                            </div>
                            <button onClick={() => handleUnlinkGroup(group.id)} className="h-7 px-2.5 rounded-md border text-xs text-red-500 border-red-200 bg-transparent hover:bg-red-50">解除关联</button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
                    <p className="text-gray-500 text-sm">
                      暂无{viewType === 'positive' ? '正向' : '负面'}词组。
                      <button onClick={() => setShowLinkModal(true)} className="text-accent hover:underline ml-1">关联一个词组</button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500">
              <strong>词组说明</strong> · 正向词组用于描述"要生成什么"，负面词组用于描述"不要生成什么"。
              类型切换仅改变 <code className="text-xs font-mono px-1 py-0.5 rounded bg-gray-100">workspace_groups.type</code>，组本身内容和关联不受影响。
            </p>
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建工作空间"
        description="创建一个新的提示词工作空间"
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">工作空间名称</label>
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="例如：AI 绘画提示词库"
              className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">描述</label>
            <textarea
              value={newWorkspaceDesc}
              onChange={(e) => setNewWorkspaceDesc(e.target.value)}
              placeholder="简单描述这个工作空间的用途…"
              className="w-full h-16 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none resize-none bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">创建后可以随时修改</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-2">主题色</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewWorkspaceColor(color)}
                  className="w-7 h-7 rounded-md border-2 cursor-pointer"
                  style={{
                    background: color === '255' 
                      ? 'oklch(58% 0.18 255)' 
                      : color === '170' 
                        ? 'oklch(56% 0.12 170)'
                        : `oklch(58% 0.18 ${color})`,
                    borderColor: newWorkspaceColor === color ? '#000' : 'transparent'
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateWorkspace}>创建工作空间</Button>
          </div>
        </div>
      </Modal>

      {/* Link Group Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="关联词组到当前工作空间"
        description="选择要关联的词组，并指定属于正向词组还是负面词组。支持多选。"
      >
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {availableGroups.length > 0 ? (
            availableGroups.map((group) => {
              const isSelected = selectedGroups.includes(group.id);
              const groupTagsList = getGroupTags(group.id);
              return (
                <div
                  key={group.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedGroups(selectedGroups.filter((id) => id !== group.id));
                    } else {
                      setSelectedGroups([...selectedGroups, group.id]);
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-accent border-accent' : 'border-gray-200'
                    }`}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{group.name}</div>
                    <div className="text-xs text-gray-500">
                      {groupTagsList.length} 个提示词 · {isSelected ? '已关联此工作空间' : '未关联'}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">所有词组已关联</p>
          )}
        </div>
        <div className="flex items-center gap-3 mt-4 pt-3.5 border-t border-gray-200">
          <label className="text-sm font-medium">关联类型：</label>
          <div className="flex gap-1">
            <button
              onClick={() => setViewType('positive')}
              className={`px-4 py-1 rounded-md border text-xs cursor-pointer ${
                viewType === 'positive'
                  ? 'bg-green-100 border-green-300 text-green-700 font-medium'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              正向词组
            </button>
            <button
              onClick={() => setViewType('negative')}
              className={`px-4 py-1 rounded-md border text-xs cursor-pointer ${
                viewType === 'negative'
                  ? 'bg-red-100 border-red-300 text-red-700 font-medium'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              负面词组
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => setShowLinkModal(false)}>
            取消
          </Button>
          <Button onClick={handleLinkGroups} disabled={selectedGroups.length === 0}>
            确认关联 {selectedGroups.length > 0 && `(${selectedGroups.length})`} 个词组
          </Button>
        </div>
      </Modal>

      <Toast {...toast} onClose={hideToast} />
    </Layout>
  );
};