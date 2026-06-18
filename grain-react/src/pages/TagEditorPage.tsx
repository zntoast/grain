import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Copy, Save, Trash2, ChevronRight, Plus, X } from 'lucide-react';
import { useStore } from '../store';
import { Layout, Button, Modal, useToast, Toast } from '../components';
import { CATEGORIES } from '../types';
import { isSaveShortcut } from '../utils/saveShortcut';

export const TagEditorPage: React.FC = () => {
  const { tagId } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const {
    tags,
    groups,
    groupTags,
    updateTag,
    deleteTag,
    linkTagToGroup,
    unlinkTagFromGroup,
  } = useStore();

  const [en, setEn] = useState('');
  const [zh, setZh] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // 当前 Tag
  const tag = tags.find((t) => t.id === tagId);
  const prevTagIdRef = useRef<string | undefined>(undefined);

  // 初始化表单
  useEffect(() => {
    if (tag && prevTagIdRef.current !== tagId) {
      setEn(tag.en);
      setZh(tag.zh);
      setCategory(tag.category);
      prevTagIdRef.current = tagId;
    }
  }, [tag, tagId]);

  // 所属词组
  const parentGroups = groups.filter((g) => {
    const tagIds = groupTags[g.id] || [];
    return tagIds.includes(tagId || '');
  });

  // 可关联的词组
  const availableGroups = groups.filter((g) => {
    const tagIds = groupTags[g.id] || [];
    return !tagIds.includes(tagId || '');
  });

  // 保存
  const handleSave = useCallback(() => {
    if (!tagId || !en.trim()) return;
    updateTag(tagId, {
      en: en.trim(),
      zh: zh.trim(),
      category,
    });
    showToast('已保存');
  }, [category, en, showToast, tagId, updateTag, zh]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSaveShortcut(event)) return;
      event.preventDefault();
      handleSave();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // 复制单词
  const handleCopy = () => {
    if (!tag) return;
    navigator.clipboard.writeText(tag.en);
    showToast('已复制');
  };

  // 删除
  const handleDelete = () => {
    if (!tagId) return;
    deleteTag(tagId);
    navigate('/tags');
  };

  // 关联词组
  const handleLinkGroups = () => {
    if (!tagId) return;
    selectedGroups.forEach((groupId) => {
      linkTagToGroup(groupId, tagId);
    });
    setShowLinkModal(false);
    setSelectedGroups([]);
  };

  if (!tag) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">提示词不存在</p>
            <Button onClick={() => navigate('/tags')}>返回列表</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="page-header px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link to="/tags" className="hover:text-accent">
                全部提示词
              </Link>
              <ChevronRight size={14} />
              <span className="text-gray-900 font-medium">{tag.en}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <Copy size={12} />
                复制单词
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save size={12} />
                保存
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-xl mx-auto">
            {/* Form */}
            <div className="surface-card p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">基本信息</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    英文单词 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={en}
                    onChange={(e) => setEn(e.target.value)}
                    placeholder="例如：cinematic_lighting"
                    className="form-control w-full h-10 px-3 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">中文释义</label>
                  <input
                    type="text"
                    value={zh}
                    onChange={(e) => setZh(e.target.value)}
                    placeholder="例如：电影布光"
                    className="form-control w-full h-10 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">分类</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-control w-full h-10 px-3 text-sm"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Parent Groups */}
            <div className="surface-card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">所属词组</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowLinkModal(true)}>
                  <Plus size={12} />
                  加入词组
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {parentGroups.map((g) => (
                  <div
                    key={g.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e8e2e3] bg-[#fdfaf8] text-sm"
                  >
                    <Link to={`/group/${g.id}`} className="text-gray-900 hover:text-accent">
                      {g.name}
                    </Link>
                    <button
                      onClick={() => unlinkTagFromGroup(g.id, tagId!)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {parentGroups.length === 0 && (
                  <span className="text-sm text-gray-400">未关联任何词组</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 size={14} />
                删除提示词
              </Button>
              <Button onClick={handleSave}>
                <Save size={14} />
                保存更改
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Link Group Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="加入词组"
        description={`将「${tag.en}」加入到以下词组`}
      >
        <div className="space-y-4">
          <div className="max-h-64 overflow-y-auto space-y-2">
            {availableGroups.length > 0 ? (
              availableGroups.map((g) => (
                <label
                  key={g.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedGroups.includes(g.id)
                      ? 'border-accent bg-accent/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(g.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGroups([...selectedGroups, g.id]);
                      } else {
                        setSelectedGroups(selectedGroups.filter((id) => id !== g.id));
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{g.name}</div>
                    <div className="text-xs text-gray-500">{g.desc}</div>
                  </div>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                已加入所有词组
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowLinkModal(false)}>
              取消
            </Button>
            <Button onClick={handleLinkGroups} disabled={selectedGroups.length === 0}>
              加入 {selectedGroups.length > 0 && `(${selectedGroups.length})`}
            </Button>
          </div>
        </div>
      </Modal>

      <Toast {...toast} onClose={hideToast} />
    </Layout>
  );
};
