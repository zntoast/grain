import React, { useState, useMemo } from 'react';
import { Plus, Copy, ChevronDown } from 'lucide-react';
import { useStore } from '../store';
import { Modal, Button, SearchBox, TagChip, ImagePreview, useToast, Toast } from '../components';
import { CATEGORIES } from '../types';
import { filterVisibleCategories, filterVisibleTags } from '../utils/categoryVisibility';

interface GroupTagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | null;
}

export const GroupTagEditModal: React.FC<GroupTagEditModalProps> = ({ isOpen, onClose, groupId }) => {
  const { toast, showToast, hideToast } = useToast();
  const { groups, tags, groupTags, toggleTagInGroup, addTag, linkTagToGroup, updateGroup, showR18Category } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTagEn, setNewTagEn] = useState('');
  const [newTagZh, setNewTagZh] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<string>(CATEGORIES[0]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const visibleCategories = useMemo<string[]>(
    () => filterVisibleCategories(CATEGORIES, showR18Category),
    [showR18Category],
  );
  const fallbackCategory = visibleCategories[0] || CATEGORIES[0];
  const effectiveSelectedCategory = selectedCategory && visibleCategories.includes(selectedCategory)
    ? selectedCategory
    : null;
  const effectiveNewTagCategory = visibleCategories.includes(newTagCategory)
    ? newTagCategory
    : fallbackCategory;

  const group = groups.find((g) => g.id === groupId);
  const currentTagIds = groupId ? groupTags[groupId] || [] : [];
  const currentTags = currentTagIds
    .map((tagId) => tags.find((t) => t.id === tagId))
    .filter(Boolean);
  const visibleCurrentTags = useMemo(
    () => filterVisibleTags(currentTags, showR18Category),
    [currentTags, showR18Category],
  );

  // 自定义提示词行
  const customLines = customInput
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // 所有标签（带搜索和分类筛选）
  const availableTags = useMemo(() => {
    return filterVisibleTags(tags, showR18Category).filter((t) => {
      const matchesSearch = searchQuery
        ? t.en.toLowerCase().includes(searchQuery.toLowerCase()) || t.zh.includes(searchQuery)
        : true;
      const matchesCategory = effectiveSelectedCategory ? t.category === effectiveSelectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [tags, searchQuery, effectiveSelectedCategory, showR18Category]);

  // 按分类分组
  const groupedTags = useMemo(() => {
    const grouped: Record<string, typeof availableTags> = {};
    availableTags.forEach((t) => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });
    return grouped;
  }, [availableTags]);

  const handleToggleTag = (tagId: string) => {
    if (!groupId) return;
    toggleTagInGroup(groupId, tagId);
  };

  const handleAddTag = () => {
    if (!newTagEn.trim() || !groupId) return;
    const newTag = addTag({
      en: newTagEn.trim(),
      zh: newTagZh.trim(),
      category: effectiveNewTagCategory,
    });
    linkTagToGroup(groupId, newTag.id);
    setShowAddForm(false);
    setNewTagEn('');
    setNewTagZh('');
    setNewTagCategory(CATEGORIES[0]);
    showToast('已添加并关联');
  };

  const handleCopyAll = () => {
    const allPrompts = [...visibleCurrentTags.map((t) => t!.en), ...customLines].join(', ');
    navigator.clipboard.writeText(allPrompts);
    showToast('已复制全部提示词');
  };

  const handleImageChange = (url: string) => {
    if (groupId) {
      updateGroup(groupId, { imageUrl: url });
    }
  };

  // 关闭时重置状态
  const handleClose = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setShowAddForm(false);
    setShowCustomInput(false);
    setCustomInput('');
    onClose();
  };

  if (!group) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="管理提示词" description={group.name} width="w-[900px]">
        <div className="space-y-4">
          {/* 图片预览 + 当前提示词 - 左右布局 */}
          <div className="flex gap-4">
            {/* 左侧 - 图片预览 */}
            <div className="w-1/3 flex-shrink-0">
              <h4 className="text-xs font-semibold text-gray-500 mb-2">效果预览</h4>
              <ImagePreview
                imageUrl={group.imageUrl || ''}
                onImageChange={handleImageChange}
              />
            </div>

            {/* 右侧 - 当前提示词 + 自定义提示词 */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* 当前提示词 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-500">
                    当前提示词
                    <span className="ml-1 font-normal text-gray-400">({visibleCurrentTags.length} 个)</span>
                  </h4>
                  <Button variant="ghost" size="sm" onClick={handleCopyAll}>
                    <Copy size={12} />
                    复制
                  </Button>
                </div>
                {visibleCurrentTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {visibleCurrentTags.map((tag) => (
                      <TagChip
                        key={tag!.id}
                        en={tag!.en}
                        zh={tag!.zh}
                        size="sm"
                        selected
                        onRemove={() => handleToggleTag(tag!.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#fdfaf8] border border-dashed border-[#d9d0d3] rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400">暂无提示词，从下方选择添加</p>
                  </div>
                )}
              </div>

              {/* 自定义提示词 */}
              <div>
                <button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${showCustomInput ? '' : '-rotate-90'}`}
                  />
                  自定义提示词
                  {customLines.length > 0 && (
                    <span className="text-gray-400">({customLines.length} 行)</span>
                  )}
                </button>
                {showCustomInput && (
                  <div className="mt-2">
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="每行一个提示词，如：&#10;best quality&#10;masterpiece"
                      className="w-full h-20 px-3 py-2 text-xs font-mono text-gray-700 bg-[#fdfaf8] border border-[#e8e2e3] rounded-xl resize-none focus:outline-none focus:border-accent"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 搜索 + 新增按钮 */}
          <div className="flex items-center gap-3">
            <SearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="搜索提示词..."
              className="flex-1"
            />
            <Button variant="secondary" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus size={12} />
              新增
            </Button>
          </div>

          {/* 新增表单 */}
          {showAddForm && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">英文</label>
                  <input
                    type="text"
                    value={newTagEn}
                    onChange={(e) => setNewTagEn(e.target.value)}
                    placeholder="如 cinematic_lighting"
                    className="form-control w-full h-9 px-3 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">中文</label>
                  <input
                    type="text"
                    value={newTagZh}
                    onChange={(e) => setNewTagZh(e.target.value)}
                    placeholder="如 电影布光"
                    className="form-control w-full h-9 px-3 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={effectiveNewTagCategory}
                  onChange={(e) => setNewTagCategory(e.target.value)}
                  className="form-control h-9 px-3 text-sm"
                >
                  {visibleCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Button size="sm" onClick={handleAddTag} disabled={!newTagEn.trim()}>
                  添加
                </Button>
              </div>
            </div>
          )}

          {/* 分类筛选 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`filter-chip control-press !px-2.5 !py-1 !text-xs ${
                effectiveSelectedCategory === null ? 'filter-chip-active' : ''
              }`}
            >
              全部
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`filter-chip control-press !px-2.5 !py-1 !text-xs ${
                  effectiveSelectedCategory === cat ? 'filter-chip-active' : ''
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 标签选择区 */}
          <div className="max-h-[300px] overflow-y-auto space-y-5">
            {Object.keys(groupedTags).length > 0 ? (
              Object.entries(groupedTags).map(([category, categoryTags]) => (
                <div key={category}>
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
              <p className="text-center text-sm text-gray-400 py-8">
                {searchQuery ? '没有匹配的提示词' : '暂无可用提示词'}
              </p>
            )}
          </div>
        </div>
      </Modal>
      <Toast {...toast} onClose={hideToast} />
    </>
  );
};
