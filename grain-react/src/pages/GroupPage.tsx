import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Copy,
  GripVertical,
  Trash2,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';
import { Layout, Button, SearchBox, TagChip, Modal, useToast, Toast, TagEditorModal } from '../components';
import { CATEGORIES } from '../types';

// Sortable Tag Item
interface SortableTagItemProps {
  tagId: string;
  tag: { id: string; en: string; zh: string; category: string } | undefined;
  onRemove: () => void;
  onEdit: () => void;
}

const SortableTagItem: React.FC<SortableTagItemProps> = ({ tagId, tag, onRemove, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tagId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!tag) return null;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <button {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500">
        <GripVertical size={12} />
      </button>
      <TagChip
        en={tag.en}
        zh={tag.zh}
        onRemove={onRemove}
        onDoubleClick={onEdit}
        size="sm"
      />
    </div>
  );
};

// 可拖拽的分隔条
const ResizableDivider: React.FC<{
  onMouseDown: (e: React.MouseEvent) => void;
}> = ({ onMouseDown }) => {
  return (
    <div
      className="w-1 bg-gray-200 hover:bg-accent cursor-col-resize transition-colors flex-shrink-0"
      onMouseDown={onMouseDown}
    />
  );
};

export const GroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const {
    groups,
    tags,
    workspaces,
    workspaceGroups,
    groupTags,
    addTag,
    linkTagToGroup,
    unlinkTagFromGroup,
    reorderTagsInGroup,
    deleteGroup,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagEn, setNewTagEn] = useState('');
  const [newTagZh, setNewTagZh] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<string>(CATEGORIES[0]);
  const [customTags, setCustomTags] = useState(''); // 自定义提示词输入
  const [showEditModal, setShowEditModal] = useState(false); // 编辑弹窗
  const [editingTagId, setEditingTagId] = useState<string | null>(null); // 当前编辑的 Tag ID

  // 水平分隔条拖拽状态（左右面板）
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDraggingH, setIsDraggingH] = useState(false);

  // 垂直分隔条拖拽状态（左侧面板内部）
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [tagListHeight, setTagListHeight] = useState(50);
  const [isDraggingV, setIsDraggingV] = useState(false);

  const handleMouseDownH = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingH(true);
  }, []);

  const handleMouseMoveH = useCallback((e: MouseEvent) => {
    if (!isDraggingH || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    setLeftWidth(Math.min(Math.max(newWidth, 20), 80));
  }, [isDraggingH]);

  const handleMouseUpH = useCallback(() => {
    setIsDraggingH(false);
  }, []);

  const handleMouseDownV = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingV(true);
  }, []);

  const handleMouseMoveV = useCallback((e: MouseEvent) => {
    if (!isDraggingV || !leftPanelRef.current) return;
    const panelRect = leftPanelRef.current.getBoundingClientRect();
    const newHeight = ((e.clientY - panelRect.top) / panelRect.height) * 100;
    setTagListHeight(Math.min(Math.max(newHeight, 20), 80));
  }, [isDraggingV]);

  const handleMouseUpV = useCallback(() => {
    setIsDraggingV(false);
  }, []);

  React.useEffect(() => {
    if (isDraggingH) {
      document.addEventListener('mousemove', handleMouseMoveH);
      document.addEventListener('mouseup', handleMouseUpH);
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveH);
        document.removeEventListener('mouseup', handleMouseUpH);
      };
    }
  }, [isDraggingH, handleMouseMoveH, handleMouseUpH]);

  React.useEffect(() => {
    if (isDraggingV) {
      document.addEventListener('mousemove', handleMouseMoveV);
      document.addEventListener('mouseup', handleMouseUpV);
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveV);
        document.removeEventListener('mouseup', handleMouseUpV);
      };
    }
  }, [isDraggingV, handleMouseMoveV, handleMouseUpV]);

  // 当前词组
  const group = groups.find((g) => g.id === groupId);

  // 当前词组的 Tag 列表
  const currentTagIds = groupId ? groupTags[groupId] || [] : [];
  const currentTags = currentTagIds
    .map((tagId) => tags.find((t) => t.id === tagId))
    .filter(Boolean);

  // 所属工作空间
  const parentWorkspaces = useMemo(() => {
    return workspaces.filter((ws) => {
      const entries = workspaceGroups[ws.id] || [];
      return entries.some((e) => e.groupId === groupId);
    });
  }, [workspaces, workspaceGroups, groupId]);

  // 所有可选的 Tag（不筛选是否已选中）
  const allAvailableTags = useMemo(() => {
    return tags.filter((t) => {
      const matchesSearch = searchQuery
        ? t.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.zh.includes(searchQuery)
        : true;
      const matchesCategory = selectedCategory ? t.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [tags, searchQuery, selectedCategory]);

  // 按分类分组
  const groupedAvailableTags = useMemo(() => {
    const grouped: Record<string, typeof allAvailableTags> = {};
    allAvailableTags.forEach((t) => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });
    return grouped;
  }, [allAvailableTags]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentTagIds.indexOf(active.id as string);
      const newIndex = currentTagIds.indexOf(over.id as string);
      const newOrder = arrayMove(currentTagIds, oldIndex, newIndex);
      if (groupId) {
        reorderTagsInGroup(groupId, newOrder);
      }
    }
  };

  // 复制全部提示词（包含自定义）
  const handleCopyAll = () => {
    const tagWords = currentTags.map((t) => t!.en);
    const customWords = customTags.split('\n').filter(line => line.trim());
    const allWords = [...tagWords, ...customWords];
    const text = allWords.join(', ');
    navigator.clipboard.writeText(text);
    showToast('已复制全部提示词');
  };

  // 添加新 Tag
  const handleAddTag = () => {
    if (!newTagEn.trim() || !groupId) return;
    const newTag = addTag({
      en: newTagEn.trim(),
      zh: newTagZh.trim(),
      category: newTagCategory,
    });
    linkTagToGroup(groupId, newTag.id);
    setShowAddTagModal(false);
    setNewTagEn('');
    setNewTagZh('');
    setNewTagCategory(CATEGORIES[0]);
  };

  // 切换 Tag（选中/取消）
  const handleToggleTag = (tagId: string) => {
    if (!groupId) return;
    if (currentTagIds.includes(tagId)) {
      unlinkTagFromGroup(groupId, tagId);
    } else {
      linkTagToGroup(groupId, tagId);
    }
  };

  if (!group) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">词组不存在</p>
            <Button onClick={() => navigate('/')}>返回首页</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900">{group.name}</h1>
              <span className="text-sm text-gray-400">({currentTags.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => {
                setCustomTags('');
                showToast('已重置');
              }}>
                取消
              </Button>
              <Button size="sm" onClick={handleCopyAll}>
                <Copy size={12} />
                保存
              </Button>
              <Button variant="danger" size="sm" onClick={() => {
                if (confirm(`确定删除词组「${group.name}」吗？`)) {
                  deleteGroup(groupId!);
                  navigate('/');
                }
              }}>
                <Trash2 size={12} />
                删除
              </Button>
            </div>
          </div>
          {group.desc && (
            <p className="text-sm text-gray-500 mt-1">{group.desc}</p>
          )}
        </header>

        {/* Summary Bar - Shows all tags as text */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">词组内容</p>
              <p className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-all">
                {currentTags.length > 0 || customTags.trim()
                  ? [...currentTags.map((t) => t!.en), ...customTags.split('\n').filter(line => line.trim())].join(', ')
                  : '暂无提示词'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCopyAll} className="ml-4 flex-shrink-0 mt-3">
              <Copy size={12} />
              复制
            </Button>
          </div>
        </div>

        {/* Content */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden flex"
          style={{ cursor: isDraggingH ? 'col-resize' : undefined }}
        >
          {/* Left Panel */}
          <div
            ref={leftPanelRef}
            className="bg-white flex flex-col min-w-0"
            style={{ width: `${leftWidth}%` }}
          >
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">已选提示词</h3>
            </div>

            {/* Tags List - Resizable */}
            <div
              className="overflow-y-auto p-4"
              style={{ height: `${tagListHeight}%` }}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={currentTagIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-wrap gap-2">
                    {currentTags.map((tag) => (
                      <SortableTagItem
                        key={tag!.id}
                        tagId={tag!.id}
                        tag={tag}
                        onRemove={() => unlinkTagFromGroup(groupId!, tag!.id)}
                        onEdit={() => {
                          setEditingTagId(tag!.id);
                          setShowEditModal(true);
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Vertical Divider */}
            <div
              className="h-1 bg-gray-200 hover:bg-accent cursor-row-resize transition-colors"
              onMouseDown={handleMouseDownV}
            />

            {/* Custom Tags Input - Resizable */}
            <div
              className="p-4 border-t border-gray-200 overflow-y-auto"
              style={{ height: `${100 - tagListHeight}%` }}
            >
              <label className="block text-xs font-medium text-gray-500 mb-2">追加自定义提示词</label>
              <textarea
                value={customTags}
                onChange={(e) => setCustomTags(e.target.value)}
                placeholder="输入自定义提示词，每行一个..."
                className="w-full h-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:border-accent focus:outline-none resize-none"
              />
            </div>

            {/* Parent Workspaces */}
            <div className="p-4 border-t border-gray-200">
              <h4 className="text-xs font-medium text-gray-500 mb-2">所属工作空间</h4>
              <div className="flex flex-wrap gap-2">
                {parentWorkspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    to={`/workspace/${ws.id}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: `oklch(58% 0.18 ${ws.color})` }}
                    />
                    {ws.name}
                  </Link>
                ))}
                {parentWorkspaces.length === 0 && (
                  <span className="text-xs text-gray-400">未关联工作空间</span>
                )}
              </div>
            </div>
          </div>

          {/* Resizable Divider */}
          <ResizableDivider onMouseDown={handleMouseDownH} />

          {/* Right Panel: Tag Selector */}
          <div
            className="flex-1 flex flex-col min-w-0 bg-gray-50"
            style={{ width: `${100 - leftWidth}%` }}
          >
            <div className="p-4 border-b border-gray-200 bg-white">
              <SearchBox
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜索提示词..."
                className="max-w-xs"
              />
            </div>

            {/* Category Filter */}
            <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2.5 py-1 rounded text-xs whitespace-nowrap ${
                  selectedCategory === null
                    ? 'bg-accent text-white'
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                全部
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-xs whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-accent text-white'
                      : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {Object.keys(groupedAvailableTags).length > 0 ? (
                Object.entries(groupedAvailableTags).map(([category, categoryTags]) => (
                  <div key={category} className="mb-6">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {categoryTags.map((tag) => (
                        <TagChip
                          key={tag.id}
                          en={tag.en}
                          zh={tag.zh}
                          selected={currentTagIds.includes(tag.id)}
                          onClick={() => handleToggleTag(tag.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>没有可用的提示词</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Tag Modal */}
      <Modal
        isOpen={showAddTagModal}
        onClose={() => setShowAddTagModal(false)}
        title="新建提示词"
        description="创建一个新的提示词"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">英文单词</label>
            <input
              type="text"
              value={newTagEn}
              onChange={(e) => setNewTagEn(e.target.value)}
              placeholder="例如：cinematic_lighting"
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">中文释义</label>
            <input
              type="text"
              value={newTagZh}
              onChange={(e) => setNewTagZh(e.target.value)}
              placeholder="例如：电影布光"
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">分类</label>
            <select
              value={newTagCategory}
              onChange={(e) => setNewTagCategory(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowAddTagModal(false)}>
              取消
            </Button>
            <Button onClick={handleAddTag}>创建并添加</Button>
          </div>
        </div>
      </Modal>

      {/* Tag Editor Modal */}
      <TagEditorModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTagId(null);
        }}
        tagId={editingTagId!}
      />

      <Toast {...toast} onClose={hideToast} />
    </Layout>
  );
};
