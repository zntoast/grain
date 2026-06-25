import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  History,
  Save,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { useStore } from '../store';
import type { WorkspacePromptConfig, WorkspacePromptItem } from '../types';
import { buildWorkspacePromptItems, createPromptOutput, moveItem } from '../utils/promptFeatures';
import { filterVisibleTags } from '../utils/categoryVisibility';
import { Button } from './Button';
import { Modal } from './Modal';

interface WorkspaceComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onMessage: (message: string) => void;
}

const emptyConfig = (): WorkspacePromptConfig => ({
  disabledGroupIds: [],
  promptOrder: [],
  disabledPromptKeys: [],
  weights: {},
});

export const WorkspaceComposerModal: React.FC<WorkspaceComposerModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  onMessage,
}) => {
  const {
    groups,
    tags,
    groupTags,
    workspaceGroups,
    workspacePromptConfigs,
    workspacePresets,
    workspaceHistory,
    showR18Category,
    setWorkspacePromptConfig,
    addWorkspacePreset,
    deleteWorkspacePreset,
    applyWorkspacePreset,
    restoreWorkspaceHistory,
  } = useStore();
  const [tab, setTab] = useState<'compose' | 'presets' | 'history'>('compose');
  const [presetName, setPresetName] = useState('');

  const config = workspacePromptConfigs[workspaceId] || emptyConfig();
  const entries = workspaceGroups[workspaceId] || [];
  const visibleTags = useMemo(
    () => filterVisibleTags(tags, showR18Category),
    [tags, showR18Category],
  );
  const items = useMemo(
    () => buildWorkspacePromptItems({
      entries,
      groups,
      groupTags,
      tags: visibleTags,
      promptOrder: config.promptOrder,
    }),
    [entries, groups, groupTags, visibleTags, config.promptOrder],
  );
  const output = useMemo(() => createPromptOutput(items, config), [items, config]);
  const presets = workspacePresets.filter((preset) => preset.workspaceId === workspaceId);
  const history = workspaceHistory.filter((entry) => entry.workspaceId === workspaceId);

  const updateConfig = (next: WorkspacePromptConfig) => {
    setWorkspacePromptConfig(workspaceId, next);
  };

  const togglePrompt = (key: string) => {
    const disabled = new Set(config.disabledPromptKeys);
    if (disabled.has(key)) disabled.delete(key);
    else disabled.add(key);
    updateConfig({ ...config, disabledPromptKeys: [...disabled] });
  };

  const updateWeight = (key: string, value: number) => {
    const weight = Math.min(2, Math.max(0.1, value || 1));
    updateConfig({ ...config, weights: { ...config.weights, [key]: weight } });
  };

  const movePrompt = (item: WorkspacePromptItem, direction: -1 | 1) => {
    const sectionItems = items.filter((entry) => entry.type === item.type);
    const currentOrder = sectionItems.map((entry) => entry.key);
    const index = currentOrder.indexOf(item.key);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= currentOrder.length) return;
    const movedSection = moveItem(currentOrder, index, nextIndex);
    const otherSection = items.filter((entry) => entry.type !== item.type).map((entry) => entry.key);
    updateConfig({
      ...config,
      promptOrder: item.type === 'positive'
        ? [...movedSection, ...otherSection]
        : [...otherSection, ...movedSection],
    });
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) {
      onMessage('请输入预设名称');
      return;
    }
    addWorkspacePreset({
      workspaceId,
      name,
      workspaceGroups: entries,
      config,
    });
    setPresetName('');
    onMessage('预设已保存');
  };

  const renderPromptSection = (
    title: string,
    type: 'positive' | 'negative',
    tone: string,
  ) => {
    const sectionItems = items.filter((item) => item.type === type);
    return (
      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className={`text-sm font-semibold ${tone}`}>{title}</h4>
          <span className="text-xs text-gray-400">{sectionItems.length} 个提示词</span>
        </div>
        <div className="space-y-1.5">
          {sectionItems.map((item) => {
            const disabled = config.disabledPromptKeys.includes(item.key)
              || config.disabledGroupIds.includes(item.groupId);
            const sectionIndex = sectionItems.findIndex((entry) => entry.key === item.key);
            return (
              <div
                key={item.key}
                className={`grid grid-cols-[52px_minmax(0,1fr)_86px_34px] items-center gap-2 px-2.5 py-2 border rounded-md ${
                  disabled ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex">
                  <button
                    className="icon-control !w-6 !h-6"
                    onClick={() => movePrompt(item, -1)}
                    disabled={sectionIndex === 0}
                    title="上移"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    className="icon-control !w-6 !h-6"
                    onClick={() => movePrompt(item, 1)}
                    disabled={sectionIndex === sectionItems.length - 1}
                    title="下移"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-xs font-semibold truncate">{item.prompt}</div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {item.groupName}{item.zh ? ` · ${item.zh}` : ''}
                  </div>
                </div>
                <label className="flex items-center gap-1 text-[10px] text-gray-500">
                  权重
                  <input
                    type="number"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={config.weights[item.key] ?? 1}
                    onChange={(event) => updateWeight(item.key, Number(event.target.value))}
                    className="form-control w-14 h-7 px-1.5 text-xs"
                  />
                </label>
                <button
                  className="icon-control !w-7 !h-7"
                  onClick={() => togglePrompt(item.key)}
                  title={disabled ? '启用提示词' : '禁用提示词'}
                >
                  {disabled ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            );
          })}
          {sectionItems.length === 0 && (
            <div className="text-center py-6 text-xs text-gray-400 border border-dashed rounded-md">
              暂无提示词
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="提示词编排"
      description="排序、禁用和权重仅作用于当前工作空间。"
      width="w-[860px]"
    >
      <div className="flex items-center gap-1 border-b border-gray-200 mb-4">
        {[
          ['compose', '编排', SlidersHorizontal],
          ['presets', `预设 ${presets.length}`, Save],
          ['history', `历史 ${history.length}`, History],
        ].map(([value, label, Icon]) => (
          <button
            key={String(value)}
            onClick={() => setTab(value as typeof tab)}
            className={`h-9 px-3 text-xs inline-flex items-center gap-1.5 border-b-2 ${
              tab === value ? 'border-accent text-accent font-medium' : 'border-transparent text-gray-500'
            }`}
          >
            <Icon size={13} />
            {String(label)}
          </button>
        ))}
      </div>

      {tab === 'compose' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-md p-3 bg-green-50/40">
              <div className="text-xs font-medium text-green-700 mb-1">正向输出</div>
              <p className="font-mono text-xs leading-relaxed break-words max-h-20 overflow-y-auto">
                {output.positiveText || '暂无'}
              </p>
            </div>
            <div className="border rounded-md p-3 bg-red-50/40">
              <div className="text-xs font-medium text-red-700 mb-1">负向输出</div>
              <p className="font-mono text-xs leading-relaxed break-words max-h-20 overflow-y-auto">
                {output.negativeText || '暂无'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5 max-h-[48vh] overflow-y-auto pr-1">
            {renderPromptSection('正向提示词', 'positive', 'text-green-700')}
            {renderPromptSection('负向提示词', 'negative', 'text-red-700')}
          </div>
        </div>
      )}

      {tab === 'presets' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
              placeholder="输入预设名称"
              className="form-control flex-1 h-9 px-3 text-sm"
            />
            <Button onClick={savePreset}>
              <Save size={13} />
              保存当前组合
            </Button>
          </div>
          <div className="space-y-2">
            {presets.map((preset) => (
              <div key={preset.id} className="flex items-center gap-3 border rounded-md px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{preset.name}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(preset.createdAt).toLocaleString()}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    applyWorkspacePreset(preset.id);
                    onMessage('预设已应用');
                  }}
                >
                  应用
                </Button>
                <button
                  className="icon-control text-red-400 hover:text-red-600"
                  onClick={() => deleteWorkspacePreset(preset.id)}
                  title="删除预设"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {presets.length === 0 && (
              <div className="text-center py-10 text-sm text-gray-400">暂无预设</div>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {history.map((entry) => (
            <div key={entry.id} className="border rounded-md px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-gray-500">
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    restoreWorkspaceHistory(entry.id);
                    onMessage('历史组合已恢复');
                  }}
                >
                  恢复
                </Button>
              </div>
              <p className="mt-2 text-xs font-mono text-gray-600 line-clamp-2">
                正向：{entry.positiveText || '无'}
              </p>
              <p className="mt-1 text-xs font-mono text-gray-500 line-clamp-2">
                负向：{entry.negativeText || '无'}
              </p>
            </div>
          ))}
          {history.length === 0 && (
            <div className="text-center py-10 text-sm text-gray-400">
              每次复制提示词组合后会自动记录，最多保留 30 条。
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
