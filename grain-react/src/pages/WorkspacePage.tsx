import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { useStore } from '../store';
import { Layout, Button, Modal, GroupTagEditModal, useToast, Toast, GroupCard } from '../components';
import { COLOR_OPTIONS } from '../constants';
import type { Group } from '../types';

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
    updateWorkspace,
    addGroup,
    linkGroupToWorkspace,
    unlinkGroupFromWorkspace,
    setGroupType,
    updateWorkspaceGroupOrder,
  } = useStore();

  const [viewType, setViewType] = useState<'positive' | 'negative' | 'all'>('positive');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'row'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [newWorkspaceColor, setNewWorkspaceColor] = useState(COLOR_OPTIONS[0]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dropOverGroupId, setDropOverGroupId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingWsField, setEditingWsField] = useState<'name' | 'desc' | null>(null);
  const [editingWsValue, setEditingWsValue] = useState('');
  const [openWorkspaceIds, setOpenWorkspaceIds] = useState<string[]>(() => 
    workspaceId ? [workspaceId] : []
  );
  const prevWorkspaceIdRef = useRef(workspaceId);
  const [disabledGroupIds, setDisabledGroupIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (workspaceId && workspaceId !== prevWorkspaceIdRef.current && !openWorkspaceIds.includes(workspaceId)) {
      setOpenWorkspaceIds((prev) => [...prev, workspaceId]);
    }
    prevWorkspaceIdRef.current = workspaceId;
  }, [workspaceId, openWorkspaceIds]);

  // 当前工作空间
  const workspace = workspaces.find((ws) => ws.id === workspaceId);

  // 当前工作空间的词组列表
  const workspaceGroupEntries = useMemo(() => 
    workspaceId ? workspaceGroups[workspaceId] || [] : [],
    [workspaceId, workspaceGroups]
  );

  // 按类型筛选词组
  const filteredGroups = useMemo(() => {
    let entries = workspaceGroupEntries;
    if (viewType !== 'all') {
      entries = entries.filter((e) => e.type === viewType);
    }
    return entries
      .map((e) => ({ group: groups.find((g) => g.id === e.groupId), type: e.type }))
      .filter((item): item is { group: Group; type: 'positive' | 'negative' } => Boolean(item.group));
  }, [workspaceGroupEntries, viewType, groups]);

  // 汇总所有提示词（包括自定义提示词）
  const allTags = useMemo(() => {
    const result: Array<{ en: string; zh: string; category: string }> = [];
    filteredGroups.forEach((item) => {
      if (item.group && !disabledGroupIds.has(item.group.id)) {
        // 标准提示词
        (groupTags[item.group.id] || []).forEach((tagId) => {
          const tag = tags.find((t) => t.id === tagId);
          if (tag) result.push(tag);
        });
        // 自定义提示词
        const customLines = item.group.customTags?.split('\n').filter(line => line.trim()) || [];
        customLines.forEach(line => {
          result.push({ en: line, zh: '', category: '' });
        });
      }
    });
    return result;
  }, [filteredGroups, groupTags, tags, disabledGroupIds]);

  // 统计数据（包括自定义提示词）
  const stats = useMemo(() => {
    const positiveEntries = workspaceGroupEntries.filter((e) => e.type === 'positive');
    const negativeEntries = workspaceGroupEntries.filter((e) => e.type === 'negative');
    let totalTagCount = 0;
    
    workspaceGroupEntries.forEach((e) => {
      // 标准提示词数量
      totalTagCount += (groupTags[e.groupId] || []).length;
      // 自定义提示词数量
      const group = groups.find((g) => g.id === e.groupId);
      const customCount = (group?.customTags?.split('\n').filter(line => line.trim()) || []).length;
      totalTagCount += customCount;
    });
    
    return {
      groupCount: workspaceGroupEntries.length,
      positiveCount: positiveEntries.length,
      negativeCount: negativeEntries.length,
      tagCount: totalTagCount,
      workspaceCount: workspaces.length,
    };
  }, [workspaceGroupEntries, groupTags, workspaces, groups]);

  // 获取词组的所有提示词（包括自定义提示词）
  const getGroupAllTags = (groupId: string) => {
    const tagIds = groupTags[groupId] || [];
    const standardTags = tagIds
      .map((tagId) => tags.find((t) => t.id === tagId))
      .filter(Boolean);
    const group = groups.find((g) => g.id === groupId);
    const customLines = group?.customTags?.split('\n').filter(line => line.trim()) || [];
    return [...standardTags, ...customLines.map(line => ({ en: line, zh: '', category: '' } as any))];
  };

  // 获取词组的图片 URL
  const getGroupImageUrl = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group?.imageUrl || '';
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
    setOpenWorkspaceIds((prev) => [...prev, ws.id]);
    setShowCreateModal(false);
    setNewWorkspaceName('');
    setNewWorkspaceDesc('');
    setNewWorkspaceColor(COLOR_OPTIONS[0]);
    navigate(`/workspace/${ws.id}`);
  };

  // 更新工作空间名称/描述
  const handleUpdateWorkspace = () => {
    if (!workspaceId || !editingWsField || !editingWsValue.trim()) {
      setEditingWsField(null);
      return;
    }
    updateWorkspace(workspaceId, { [editingWsField]: editingWsValue.trim() });
    setEditingWsField(null);
  };

  // 新建词组并关联到当前工作空间
  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !workspaceId) return;
    const group = addGroup({ name: newGroupName.trim(), desc: newGroupDesc.trim() });
    linkGroupToWorkspace(workspaceId, group.id, viewType === 'negative' ? 'negative' : 'positive');
    setShowNewGroupModal(false);
    setNewGroupName('');
    setNewGroupDesc('');
    showToast('已创建并关联词组');
  };

  // 关联词组
  const handleLinkGroups = () => {
    if (!workspaceId) return;
    const linkType = viewType === 'negative' ? 'negative' : 'positive';
    selectedGroups.forEach((groupId) => {
      linkGroupToWorkspace(workspaceId, groupId, linkType);
    });
    setShowLinkModal(false);
    setSelectedGroups([]);
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

  const handleToggleGroup = (groupId: string) => {
    setDisabledGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
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

  // 稳定的回调函数
  const handleEditGroup = useCallback((groupId: string) => {
    setEditingGroupId(groupId);
  }, []);

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
        {/* Workspace Tabs */}
        <div className="h-12 border-b border-[#e8e2e3] flex items-center gap-1 px-6 bg-[#fffefc] flex-shrink-0">
          {openWorkspaceIds.map((id) => {
            const ws = workspaces.find((w) => w.id === id);
            if (!ws) return null;
            const isActive = ws.id === workspaceId;
            return (
              <div
                key={ws.id}
                onClick={() => navigate(`/workspace/${ws.id}`)}
                className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-t-md text-sm font-medium relative transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#b52f64] bg-[#fff0f5]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-[#f7f3f1]'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: isActive ? '#fff' : `oklch(58% 0.18 ${ws.color})` }}
                />
                {ws.name}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-sm workspace-tab-active"
                  />
                )}
                {openWorkspaceIds.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = openWorkspaceIds.indexOf(ws.id);
                      const remaining = openWorkspaceIds.filter((oid) => oid !== ws.id);
                      setOpenWorkspaceIds(remaining);
                      if (isActive) {
                        const next = remaining[Math.min(idx, remaining.length - 1)];
                        navigate(`/workspace/${next}`);
                      }
                    }}
                    className="w-4 h-4 rounded text-xs text-gray-400 hover:bg-gray-200 hover:text-gray-600 flex items-center justify-center ml-0.5"
                    title="关闭"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={() => setShowCreateModal(true)}
            className="control-press icon-control !w-8 !h-8 border border-dashed border-[#d9d0d3] bg-transparent text-gray-400 cursor-pointer text-base hover:bg-[#fff0f5] hover:text-accent hover:border-accent ml-1 flex-shrink-0"
            aria-label="新建工作空间"
            title="新建工作空间"
          >
            +
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#faf9f7]">
          {/* Page Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              {editingWsField === 'name' ? (
                <input
                  type="text"
                  value={editingWsValue}
                  onChange={(e) => setEditingWsValue(e.target.value)}
                  onBlur={handleUpdateWorkspace}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateWorkspace()}
                  onKeyUp={(e) => e.key === 'Escape' && setEditingWsField(null)}
                  className="text-2xl font-semibold tracking-tight leading-tight w-full px-2 py-1 border border-accent rounded-lg outline-none"
                  autoFocus
                />
              ) : (
                <h1
                  className="text-2xl font-semibold tracking-tight leading-tight cursor-pointer hover:text-accent"
                  onDoubleClick={() => { setEditingWsField('name'); setEditingWsValue(workspace.name); }}
                  title="双击编辑名称"
                >
                  {workspace.name}
                </h1>
              )}
              {editingWsField === 'desc' ? (
                <input
                  type="text"
                  value={editingWsValue}
                  onChange={(e) => setEditingWsValue(e.target.value)}
                  onBlur={handleUpdateWorkspace}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateWorkspace()}
                  onKeyUp={(e) => e.key === 'Escape' && setEditingWsField(null)}
                  className="text-sm text-gray-500 mt-1 w-full px-2 py-1 border border-accent rounded-lg outline-none"
                  autoFocus
                />
              ) : (
                <p
                  className="text-sm text-gray-500 mt-1 cursor-pointer hover:text-gray-700"
                  onDoubleClick={() => { setEditingWsField('desc'); setEditingWsValue(workspace.desc); }}
                  title="双击编辑描述"
                >
                  {workspace.desc} · 关联 {stats.groupCount} 个词组
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowLinkModal(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                关联词组
              </Button>
              <Button variant="gradient" onClick={() => setShowNewGroupModal(true)}>
                <Plus size={14} />
                新增词组
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="surface-card p-4 card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg icon-bg-workspace flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                </div>
                <span className="text-xs text-gray-500">关联词组数</span>
              </div>
              <div className="text-2xl font-semibold tracking-tight tabular-nums">{stats.groupCount}</div>
            </div>
            <div className="surface-card p-4 card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg icon-bg-tag flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                </div>
                <span className="text-xs text-gray-500">涉及提示词</span>
              </div>
              <div className="text-2xl font-semibold tracking-tight tabular-nums">{stats.tagCount}</div>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex gap-0.5 p-1 bg-[#f1ecea] border border-[#e8e2e3] rounded-xl">
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

            {/* 布局切换 */}
            <div className="flex gap-0.5 p-1 bg-[#f1ecea] border border-[#e8e2e3] rounded-[10px]">
              <button
                onClick={() => setLayoutMode('grid')}
                title="网格视图"
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                  layoutMode === 'grid' ? 'bg-accent text-white' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setLayoutMode('row')}
                title="行视图"
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                  layoutMode === 'row' ? 'bg-accent text-white' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List size={14} />
              </button>
            </div>

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
                    <span>正向提示词汇总（{filteredGroups.filter(g => g.type === 'positive' && !disabledGroupIds.has(g.group!.id)).reduce((acc, g) => {
                      const standardCount = (groupTags[g.group!.id] || []).length;
                      const customCount = (g.group!.customTags?.split('\n').filter(line => line.trim()) || []).length;
                      return acc + standardCount + customCount;
                    }, 0)} 个词）</span>
                    <button
                      onClick={() => {
                        const positiveGroups = filteredGroups.filter(g => g.type === 'positive' && !disabledGroupIds.has(g.group!.id));
                        const allTagsText = positiveGroups.flatMap(g => getGroupAllTags(g.group!.id).map(t => t!.en)).join(', ');
                        navigator.clipboard.writeText(allTagsText);
                        showToast('已复制正向提示词');
                      }}
                      className="bg-none border-none text-accent cursor-pointer text-xs px-1.5 py-0.5 rounded hover:bg-accent/10"
                    >
                      复制全部
                    </button>
                  </div>
                  <div className="p-2.5 font-mono text-xs leading-relaxed text-gray-900 min-h-12 max-h-48 overflow-y-auto">
                    {filteredGroups.filter(g => g.type === 'positive' && !disabledGroupIds.has(g.group!.id)).map((item) => {
                      const group = item.group!;
                      const groupTagsList = getGroupAllTags(group.id);
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
                <div className={layoutMode === 'grid' ? 'grid grid-cols-3 gap-3' : 'flex flex-col gap-1.5'}>
                  {filteredGroups.filter(g => g.type === 'positive').length > 0 ? (
                    filteredGroups.filter(g => g.type === 'positive').map((item) => {
                      const groupTagsList = getGroupAllTags(item.group!.id);
                      return (
                        <GroupCard
                          key={item.group!.id}
                          group={item.group!}
                          type={item.type}
                          tagCount={groupTagsList.length}
                          tags={groupTagsList.map((t) => t!.en)}
                          previewImageUrl={getGroupImageUrl(item.group!.id)}
                          isDragging={draggedGroupId === item.group!.id}
                          isDropOver={dropOverGroupId === item.group!.id}
                          layoutMode={layoutMode}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onMouseEnter={setHoveredGroupId}
                          onMouseLeave={() => setHoveredGroupId(null)}
                          onEdit={handleEditGroup}
                          onChangeType={handleChangeGroupType}
                          onUnlink={handleUnlinkGroup}
                          disabled={disabledGroupIds.has(item.group!.id)}
                          onToggle={() => handleToggleGroup(item.group!.id)}
                        />
                      );
                    })
                  ) : (
                    <div className={layoutMode === 'grid' ? 'col-span-3' : ''}>
                      <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
                        <p className="text-gray-500 text-sm">暂无正向词组。</p>
                      </div>
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
                    <span>负面提示词汇总（{filteredGroups.filter(g => g.type === 'negative' && !disabledGroupIds.has(g.group!.id)).reduce((acc, g) => {
                      const standardCount = (groupTags[g.group!.id] || []).length;
                      const customCount = (g.group!.customTags?.split('\n').filter(line => line.trim()) || []).length;
                      return acc + standardCount + customCount;
                    }, 0)} 个词）</span>
                    <button
                      onClick={() => {
                        const negativeGroups = filteredGroups.filter(g => g.type === 'negative' && !disabledGroupIds.has(g.group!.id));
                        const allTagsText = negativeGroups.flatMap(g => getGroupAllTags(g.group!.id).map(t => t!.en)).join(', ');
                        navigator.clipboard.writeText(allTagsText);
                        showToast('已复制负面提示词');
                      }}
                      className="bg-none border-none text-accent cursor-pointer text-xs px-1.5 py-0.5 rounded hover:bg-accent/10"
                    >
                      复制全部
                    </button>
                  </div>
                  <div className="p-2.5 font-mono text-xs leading-relaxed text-gray-900 min-h-12 max-h-48 overflow-y-auto">
                    {filteredGroups.filter(g => g.type === 'negative' && !disabledGroupIds.has(g.group!.id)).map((item) => {
                      const group = item.group!;
                      const groupTagsList = getGroupAllTags(group.id);
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
                <div className={layoutMode === 'grid' ? 'grid grid-cols-3 gap-3' : 'flex flex-col gap-1.5'}>
                  {filteredGroups.filter(g => g.type === 'negative').length > 0 ? (
                    filteredGroups.filter(g => g.type === 'negative').map((item) => {
                      const groupTagsList = getGroupAllTags(item.group!.id);
                      return (
                        <GroupCard
                          key={item.group!.id}
                          group={item.group!}
                          type={item.type}
                          tagCount={groupTagsList.length}
                          tags={groupTagsList.map((t) => t!.en)}
                          previewImageUrl={getGroupImageUrl(item.group!.id)}
                          isDragging={draggedGroupId === item.group!.id}
                          isDropOver={dropOverGroupId === item.group!.id}
                          layoutMode={layoutMode}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onMouseEnter={setHoveredGroupId}
                          onMouseLeave={() => setHoveredGroupId(null)}
                          onEdit={handleEditGroup}
                          onChangeType={handleChangeGroupType}
                          onUnlink={handleUnlinkGroup}
                          disabled={disabledGroupIds.has(item.group!.id)}
                          onToggle={() => handleToggleGroup(item.group!.id)}
                        />
                      );
                    })
                  ) : (
                    <div className={layoutMode === 'grid' ? 'col-span-3' : ''}>
                      <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
                        <p className="text-gray-500 text-sm">暂无负面词组。</p>
                      </div>
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

              <div className="surface-card overflow-hidden mb-4">
                <div className="flex justify-between items-center px-3 py-2 bg-[#f7f3f1] border-b border-[#e8e2e3] text-xs text-gray-500">
                  <span>{viewType === 'positive' ? '正向' : '负面'}提示词汇总（{allTags.length} 个词）</span>
                  <button onClick={handleCopyAll} className="bg-none border-none text-accent cursor-pointer text-xs px-1.5 py-0.5 rounded hover:bg-accent/10">
                    复制全部
                  </button>
                </div>
                <div className="p-2.5 font-mono text-xs leading-relaxed text-gray-900 min-h-12 max-h-48 overflow-y-auto">
                  {filteredGroups.filter(g => !disabledGroupIds.has(g.group!.id)).map((item) => {
                    const group = item.group!;
                    const groupTagsList = getGroupAllTags(group.id);
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

              <div className={layoutMode === 'grid' ? 'grid grid-cols-3 gap-3' : 'flex flex-col gap-1.5'}>
                {filteredGroups.length > 0 ? (
                  filteredGroups.map((item) => {
                    const groupTagsList = getGroupAllTags(item.group!.id);
                    return (
                      <GroupCard
                        key={item.group!.id}
                        group={item.group!}
                        type={item.type}
                        tagCount={groupTagsList.length}
                        tags={groupTagsList.map((t) => t!.en)}
                        previewImageUrl={getGroupImageUrl(item.group!.id)}
                        isDragging={draggedGroupId === item.group!.id}
                        isDropOver={dropOverGroupId === item.group!.id}
                        layoutMode={layoutMode}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onMouseEnter={setHoveredGroupId}
                        onMouseLeave={() => setHoveredGroupId(null)}
                        onEdit={handleEditGroup}
                        onChangeType={handleChangeGroupType}
                        onUnlink={handleUnlinkGroup}
                        disabled={disabledGroupIds.has(item.group!.id)}
                        onToggle={() => handleToggleGroup(item.group!.id)}
                      />
                    );
                  })
                ) : (
                  <div className={layoutMode === 'grid' ? 'col-span-3' : ''}>
                    <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
                      <p className="text-gray-500 text-sm">
                        暂无{viewType === 'positive' ? '正向' : '负面'}词组。
                        <button onClick={() => setShowLinkModal(true)} className="text-accent hover:underline ml-1">关联一个词组</button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-6 surface-card bg-[#fdfaf8] p-4">
            <p className="text-xs text-gray-500">
              <strong>词组说明</strong> · 正向词组用于描述"要生成什么"，负面词组用于描述"不要生成什么"。
              类型切换仅改变 <code className="text-xs font-mono px-1 py-0.5 rounded bg-gray-100">workspace_groups.type</code>，组本身内容和关联不受影响。
            </p>
          </div>
        </div>
      </div>

      {/* 新增词组弹窗 */}
      <Modal
        isOpen={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        title="新增词组"
        description={`创建新词组并自动关联到「${workspace.name}」`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">词组名称</label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="例如：人物肖像"
              className="form-control w-full h-10 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">描述（可选）</label>
            <input
              type="text"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              placeholder="简短描述该词组的用途"
              className="form-control w-full h-10 px-3 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowNewGroupModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
              创建
            </Button>
          </div>
        </div>
      </Modal>

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
              className="form-control w-full h-9 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">描述</label>
            <textarea
              value={newWorkspaceDesc}
              onChange={(e) => setNewWorkspaceDesc(e.target.value)}
              placeholder="简单描述这个工作空间的用途…"
              className="form-control w-full h-16 px-3 py-2 text-sm resize-none"
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
              const groupTagsList = getGroupAllTags(group.id);
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

      <GroupTagEditModal
        isOpen={editingGroupId !== null}
        onClose={() => setEditingGroupId(null)}
        groupId={editingGroupId}
      />
      <Toast {...toast} onClose={hideToast} />
    </Layout>
  );
};
