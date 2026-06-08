import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Tag as TagIcon } from 'lucide-react';
import { useStore } from '../store';
import { Layout, Button, SearchBox, TagChip, Modal, useToast, Toast, TagEditorModal } from '../components';
import { CATEGORIES } from '../types';

export const AllTagsPage: React.FC = () => {
  const { toast, showToast, hideToast } = useToast();

  const { tags, groups, groupTags, addTags, deleteTag } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [newTagsInput, setNewTagsInput] = useState('');
  const [newTagsList, setNewTagsList] = useState<Array<{ en: string; zh: string; category: string }>>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  // 筛选后的 Tags
  const filteredTags = useMemo(() => {
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
  const groupedTags = useMemo(() => {
    const grouped: Record<string, typeof filteredTags> = {};
    filteredTags.forEach((t) => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });
    return grouped;
  }, [filteredTags]);

  // 统计
  const stats = useMemo(() => {
    const linkedCount = tags.filter((t) => {
      return groups.some((g) => (groupTags[g.id] || []).includes(t.id));
    }).length;
    return {
      total: tags.length,
      linked: linkedCount,
      filtered: filteredTags.length,
    };
  }, [tags, groups, groupTags, filteredTags]);

  // 切换选择
  const handleToggleSelect = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedTags.length === filteredTags.length) {
      setSelectedTags([]);
    } else {
      setSelectedTags(filteredTags.map((t) => t.id));
    }
  };

  // 批量删除
  const handleBatchDelete = () => {
    selectedTags.forEach((tagId) => deleteTag(tagId));
    setSelectedTags([]);
    setShowDeletePanel(false);
    showToast(`已删除 ${selectedTags.length} 个提示词`);
  };

  // 解析新 Tags 输入
  const handleParseInput = () => {
    const lines = newTagsInput.split('\n').filter((line) => line.trim());
    const parsed = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return {
        en: parts[0] || '',
        zh: parts[1] || '',
        category: parts[2] || CATEGORIES[0],
      };
    });
    setNewTagsList(parsed.filter((p) => p.en));
  };

  // 批量添加
  const handleBatchAdd = () => {
    if (newTagsList.length === 0) return;
    addTags(newTagsList);
    setShowAddModal(false);
    setNewTagsInput('');
    setNewTagsList([]);
    showToast(`已添加 ${newTagsList.length} 个提示词`);
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-gray-900">全部提示词</h1>
            <div className="flex items-center gap-3">
              <SearchBox
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜索提示词..."
                className="w-48"
              />
              <Button
                variant={batchMode ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setBatchMode(!batchMode);
                  setSelectedTags([]);
                }}
              >
                {batchMode ? '退出批量' : '批量操作'}
              </Button>
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus size={12} />
                批量新增
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>
              共 <strong className="text-gray-900">{stats.total}</strong> 个
            </span>
            <span>
              已关联词组 <strong className="text-gray-900">{stats.linked}</strong> 个
            </span>
            <span>
              当前筛选 <strong className="text-gray-900">{stats.filtered}</strong> 个
            </span>
          </div>
        </header>

        {/* Category Filter */}
        <div className="bg-gray-50 px-6 py-3 flex-shrink-0 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-accent text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            全部
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-accent text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {batchMode && (
            <div className="mb-4 flex items-center gap-4">
              <Button variant="secondary" size="sm" onClick={handleSelectAll}>
                {selectedTags.length === filteredTags.length ? '取消全选' : '全选'}
              </Button>
              {selectedTags.length > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeletePanel(true)}
                >
                  <Trash2 size={12} />
                  删除选中 ({selectedTags.length})
                </Button>
              )}
            </div>
          )}

          {Object.keys(groupedTags).length > 0 ? (
            Object.entries(groupedTags).map(([category, categoryTags]) => (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-3 section-title">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {categoryTags.map((tag) => (
                    <TagChip
                      key={tag.id}
                      en={tag.en}
                      zh={tag.zh}
                      selected={selectedTags.includes(tag.id)}
                      showCheckbox={batchMode}
                      onClick={() => {
                        if (batchMode) {
                          handleToggleSelect(tag.id);
                        }
                      }}
                      onDoubleClick={() => {
                        if (!batchMode) {
                          setEditingTagId(tag.id);
                          setShowEditModal(true);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
              <TagIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p>没有找到提示词</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="批量新增提示词"
        description="每行一个，格式：英文,中文,分类"
        width="w-[600px]"
      >
        <div className="space-y-4">
          <div>
            <textarea
              value={newTagsInput}
              onChange={(e) => setNewTagsInput(e.target.value)}
              placeholder={`cinematic_lighting,电影布光,光影\nsoft_lighting,柔光,光影\nneon_light,霓虹光影,光影`}
              className="w-full h-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none resize-none font-mono"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={handleParseInput}>
            解析预览
          </Button>
          {newTagsList.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {newTagsList.map((t, i) => (
                  <TagChip key={i} en={t.en} zh={t.zh} size="sm" />
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              取消
            </Button>
            <Button onClick={handleBatchAdd} disabled={newTagsList.length === 0}>
              添加 {newTagsList.length > 0 && `(${newTagsList.length})`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Panel */}
      <Modal
        isOpen={showDeletePanel}
        onClose={() => setShowDeletePanel(false)}
        title="确认删除"
        description={`将删除 ${selectedTags.length} 个提示词`}
      >
        <div className="space-y-4">
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                if (!tag) return null;
                return <TagChip key={tagId} en={tag.en} zh={tag.zh} size="sm" />;
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowDeletePanel(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleBatchDelete}>
              确认删除
            </Button>
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
