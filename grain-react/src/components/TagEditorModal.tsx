import React, { useState, useEffect, useRef } from 'react';
import { Copy, Save, Trash2, Plus, X } from 'lucide-react';
import { useStore } from '../store';
import { Button, Modal, useToast, Toast } from '../components';
import { CATEGORIES } from '../types';

interface TagEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagId: string;
}

export const TagEditorModal: React.FC<TagEditorModalProps> = ({ isOpen, onClose, tagId }) => {
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

  const tag = tags.find((t) => t.id === tagId);
  const prevTagIdRef = useRef<string | null>(null);
  const prevIsOpenRef = useRef(false);

  const [en, setEn] = useState('');
  const [zh, setZh] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && tag && (prevTagIdRef.current !== tagId || !prevIsOpenRef.current)) {
      setEn(tag.en);
      setZh(tag.zh);
      setCategory(tag.category);
      prevTagIdRef.current = tagId;
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, tag, tagId]);

  // 关联词组
  const parentGroups = groups.filter((g) => {
    const tagIds = groupTags[g.id] || [];
    return tagIds.includes(tagId || '');
  });

  // 可关联的词组
  const availableGroups = groups.filter((g) => {
    const tagIds = groupTags[g.id] || [];
    return !tagIds.includes(tagId || '');
  });

  const handleSave = () => {
    if (!tagId || !en.trim()) return;
    updateTag(tagId, {
      en: en.trim(),
      zh: zh.trim(),
      category,
    });
    showToast('已保存');
  };

  const handleCopy = () => {
    if (!tag) return;
    navigator.clipboard.writeText(tag.en);
    showToast('已复制');
  };

  const handleDelete = () => {
    if (!tagId) return;
    deleteTag(tagId);
    showToast('已删除');
    onClose();
  };

  const handleLinkGroups = () => {
    if (!tagId) return;
    selectedGroups.forEach((groupId) => {
      linkTagToGroup(groupId, tagId);
    });
    setShowLinkModal(false);
    setSelectedGroups([]);
    showToast('已关联');
  };

  if (!tag) {
    return null;
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="编辑提示词"
        description={tag.en}
        width="w-[600px]"
      >
        <div className="space-y-6">
          {/* Form */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">基本信息</h4>
            <div className="space-y-3">
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

          {/* Linked Groups */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">关联词组</h4>
              <Button variant="ghost" size="sm" onClick={() => setShowLinkModal(true)}>
                <Plus size={12} />
                加入词组
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {parentGroups.map((g) => (
                <div
                  key={g.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-sm"
                >
                  <span className="text-gray-900">{g.name}</span>
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
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <Copy size={12} />
              复制单词
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" onClick={handleDelete}>
                <Trash2 size={12} />
                删除
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save size={12} />
                保存
              </Button>
            </div>
          </div>
        </div>
      </Modal>

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
    </>
  );
};
