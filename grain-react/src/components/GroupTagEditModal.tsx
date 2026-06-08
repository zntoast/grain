import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../store';
import { Modal, Button, SearchBox, TagChip, useToast, Toast } from '../components';
import { CATEGORIES } from '../types';

interface GroupTagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | null;
}

export const GroupTagEditModal: React.FC<GroupTagEditModalProps> = ({ isOpen, onClose, groupId }) => {
  const { toast, showToast, hideToast } = useToast();
  const { groups, tags, groupTags, toggleTagInGroup, addTag, linkTagToGroup } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTagEn, setNewTagEn] = useState('');
  const [newTagZh, setNewTagZh] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<string>(CATEGORIES[0]);

  const group = groups.find((g) => g.id === groupId);
  const currentTagIds = groupId ? groupTags[groupId] || [] : [];

  // 所有标签（带搜索和分类筛选）
  const availableTags = useMemo(() => {
    return tags.filter((t) => {
      const matchesSearch = searchQuery
        ? t.en.toLowerCase().includes(searchQuery.toLowerCase()) || t.zh.includes(searchQuery)
        : true;
      const matchesCategory = selectedCategory ? t.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [tags, searchQuery, selectedCategory]);

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
      category: newTagCategory,
    });
    linkTagToGroup(groupId, newTag.id);
    setShowAddForm(false);
    setNewTagEn('');
    setNewTagZh('');
    setNewTagCategory(CATEGORIES[0]);
    showToast('已添加并关联');
  };

  // 关闭时重置状态
  const handleClose = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setShowAddForm(false);
    onClose();
  };

  if (!group) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="管理提示词" description={group.name} width="w-[640px]">
        <div className="space-y-4">
          {/* 已选提示词概览 */}
          {currentTagIds.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-2">
                已选 <span className="font-medium text-gray-900">{currentTagIds.length}</span> 个提示词
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentTagIds.map((tagId) => {
                  const tag = tags.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <TagChip
                      key={tagId}
                      en={tag.en}
                      zh={tag.zh}
                      size="sm"
                      selected
                      onRemove={() => handleToggleTag(tagId)}
                    />
                  );
                })}
              </div>
            </div>
          )}

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
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm font-mono focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">中文</label>
                  <input
                    type="text"
                    value={newTagZh}
                    onChange={(e) => setNewTagZh(e.target.value)}
                    placeholder="如 电影布光"
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={newTagCategory}
                  onChange={(e) => setNewTagCategory(e.target.value)}
                  className="h-9 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
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
              className={`px-2.5 py-1 rounded text-xs ${
                selectedCategory === null ? 'bg-accent text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              全部
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs ${
                  selectedCategory === cat ? 'bg-accent text-white' : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 标签选择区 */}
          <div className="max-h-[360px] overflow-y-auto space-y-5">
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
