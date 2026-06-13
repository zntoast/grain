import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Copy,
  GripVertical,
  Trash2,
  Plus,
  ChevronDown,
  X,
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
import { ImagePreview } from '../components/ImagePreview';
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
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagEn, setNewTagEn] = useState('');
  const [newTagZh, setNewTagZh] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<string>(CATEGORIES[0]);
  const [customTags, setCustomTags] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

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

  // 所有可选的 Tag
  const allAvailableTags = useMemo(() => {
    return tags.filter((t) => {
      const matchesSearch = searchQuery
        ? t.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.zh.includes(searchQuery)
        : true;
      const matchesCategory = t.category === selectedCategory;
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

  const customLines = customTags.split('\n').filter(line => line.trim());

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
    const allWords = [...tagWords, ...customLines];
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
              <Button size="sm" onClick={handleCopyAll}>
                <Copy size={12} />
                复制全部
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

        {/* Content — 单列垂直布局 */}
        <div className="flex-1 overflow-y-auto">
          {/* 图片预览 + 当前提示词 - 左右布局 */}
          <section className="p-6 pb-4">
            <div className="flex gap-4">
              {/* 左侧 - 图片预览（缩小） */}
              <div className="w-1/3 flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 section-title">效果预览</h3>
                <ImagePreview
                  imageUrl={previewImageUrl}
                  onImageChange={setPreviewImageUrl}
                />
              </div>

              {/* 右侧 - 当前提示词 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 section-title">当前提示词</h3>
                  <Button variant="ghost" size="sm" onClick={handleCopyAll}>
                    <Copy size={12} />
                    复制
                  </Button>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 h-full">
                  {currentTags.length > 0 || customLines.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {currentTags.map((tag) => (
                        <span key={tag!.id} className="text-xs px-2 py-1 rounded-lg bg-white border border-pink-100 text-gray-700 shadow-sm">
                          {tag!.en}
                        </span>
                      ))}
                      {customLines.map((line, i) => (
                        <span key={`custom-${i}`} className="text-xs px-2 py-1 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 italic">
                          {line}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-8">暂无提示词</p>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  共 {[...currentTags.map((t) => t!.en), ...customLines].length} 个提示词
                </p>
              </div>
            </div>
          </section>

          {/* 已选提示词 */}
          <section className="p-6 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 section-title">
                已选提示词
                <span className="ml-2 text-xs font-normal text-gray-400">{currentTags.length} 个</span>
              </h3>
            </div>

            {currentTags.length > 0 ? (
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
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-400">暂无提示词，从下方选择添加</p>
              </div>
            )}
          </section>

          {/* 自定义提示词（可折叠） */}
          <section className="px-6 pb-4">
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronDown
                size={14}
                className={`transition-transform ${showCustomInput ? '' : '-rotate-90'}`}
              />
              自定义提示词
              {customLines.length > 0 && (
                <span className="text-xs text-gray-400">({customLines.length} 行)</span>
              )}
            </button>

            {showCustomInput && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={customTags}
                  onChange={(e) => setCustomTags(e.target.value)}
                  placeholder="输入自定义提示词，每行一个..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:border-accent focus:outline-none resize-none"
                />
                {customTags && (
                  <button
                    onClick={() => setCustomTags('')}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
                  >
                    <X size={12} />
                    清除
                  </button>
                )}
              </div>
            )}
          </section>

          {/* 分隔线 */}
          <div className="mx-6 border-t border-gray-200" />

          {/* 选择提示词 */}
          <section className="p-6 pt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 section-title">选择提示词</h3>

            {/* 搜索 + 新增 */}
            <div className="flex items-center gap-3 mb-4">
              <SearchBox
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜索提示词..."
                className="flex-1 max-w-sm"
              />
              <Button variant="secondary" size="sm" onClick={() => setShowAddTagModal(true)}>
                <Plus size={12} />
                新增
              </Button>
            </div>

            {/* 分类筛选 */}
            <div className="flex items-center gap-2 flex-wrap mb-5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-xs ${
                    selectedCategory === cat
                      ? 'bg-accent text-white'
                      : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 标签选择区 */}
            {Object.keys(groupedAvailableTags).length > 0 ? (
              Object.entries(groupedAvailableTags).map(([category, categoryTags]) => (
                <div key={category} className="mb-5">
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {categoryTags.map((tag) => (
                      <TagChip
                        key={tag.id}
                        en={tag.en}
                        zh={tag.zh}
                        size="sm"
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
          </section>

          {/* 所属工作空间 */}
          <section className="px-6 pb-6 border-t border-gray-100 pt-4">
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
          </section>
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
