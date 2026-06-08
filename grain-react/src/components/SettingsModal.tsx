import React, { useState, useEffect } from 'react';
import { Sparkles, WandSparkles, MousePointer2, Database, HardDrive } from 'lucide-react';
import { useStore, bindDataFile, unbindDataFile } from '../store';
import { Modal } from './Modal';
import {
  getSavedDataFileHandle,
  isFileSystemAccessSupported,
  createDataFile,
} from '../services/localDataFile';
import type { CursorMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDataManager: () => void;
}

const MODES: Array<{
  id: CursorMode;
  label: string;
  title: string;
  icon: React.ReactNode;
}> = [
  { id: 'spark', label: '星芒', title: '点击扩散星芒', icon: <Sparkles size={16} /> },
  { id: 'burst', label: '花火', title: '点击花火粒子', icon: <WandSparkles size={16} /> },
  { id: 'off', label: '关闭', title: '关闭鼠标特效', icon: <MousePointer2 size={16} /> },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenDataManager }) => {
  const cursorMode = useStore((s) => s.cursorMode);
  const setCursorMode = useStore((s) => s.setCursorMode);
  const syncInterval = useStore((s) => s.syncInterval);
  const setSyncInterval = useStore((s) => s.setSyncInterval);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncFileName, setSyncFileName] = useState<string | null>(null);
  const fsSupported = isFileSystemAccessSupported();
  console.log('[Settings] fsSupported:', fsSupported);

  useEffect(() => {
    if (!isOpen) return;
    getSavedDataFileHandle().then((h) => {
      setSyncFileName(h?.name || null);
      // 开关状态始终默认关闭，不与文件句柄存在与否绑定
    });
  }, [isOpen]);

  const handleToggleSync = async (on: boolean) => {
    console.log('[Settings] handleToggleSync 被调用, on:', on);
    if (on) {
      try {
        console.log('[Settings] 检查已有文件句柄...');
        const existing = await getSavedDataFileHandle();
        console.log('[Settings] 已有句柄:', existing?.name || '无');
        const handle = existing || await createDataFile();
        console.log('[Settings] 获取到句柄:', handle.name, '准备绑定...');
        await bindDataFile(handle);
        console.log('[Settings] bindDataFile 完成');
        setSyncEnabled(true);
        setSyncFileName(handle.name);
      } catch (e) {
        console.error('[Settings] handleToggleSync 失败:', e);
        setSyncEnabled(false);
      }
    } else {
      console.log('[Settings] 关闭同步');
      unbindDataFile();
      setSyncEnabled(false);
      setSyncFileName(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="设置" width="w-[480px]">
      <div className="space-y-6">
        {/* 鼠标特效 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">鼠标特效</h4>
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
            {MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                title={item.title}
                onClick={() => setCursorMode(item.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  cursorMode === item.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className={cursorMode === item.id ? 'text-accent' : 'text-gray-400'}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>
          {cursorMode !== 'off' && (
            <p className="mt-2 text-xs text-gray-400">
              {cursorMode === 'spark'
                ? '鼠标移动带拖尾粒子，点击产生星芒扩散效果。'
                : '鼠标移动带拖尾粒子，点击产生花火粒子效果。'}
            </p>
          )}
        </div>

        {/* 本地自动同步 */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-900">本地文件自动同步</h4>
            </div>
            {fsSupported ? (
              <button
                onClick={() => handleToggleSync(!syncEnabled)}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  syncEnabled ? 'bg-accent' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    syncEnabled ? 'translate-x-4' : ''
                  }`}
                />
              </button>
            ) : (
              <span className="text-xs text-gray-400">浏览器不支持</span>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {syncEnabled
              ? `已启用 · 每 ${syncInterval} 秒自动将数据同步到本地文件「${syncFileName || 'grain-data.json'}」。`
              : `默认关闭。启用后选择或创建本地 JSON 文件，内存数据会按设置间隔自动写入该文件。换浏览器时可选择同一文件恢复数据。`}
          </p>
          {syncEnabled && (
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">同步间隔</label>
              <input
                type="number"
                min={1}
                value={syncInterval}
                onChange={(e) => setSyncInterval(Number(e.target.value))}
                className="w-16 h-8 px-2 border border-gray-200 rounded-lg text-xs text-center focus:border-accent focus:outline-none"
              />
              <span className="text-xs text-gray-400">秒</span>
            </div>
          )}
          {syncEnabled && syncFileName && (
            <p className="mt-1.5 text-xs text-gray-400">
              当前文件：<span className="font-medium text-gray-600">{syncFileName}</span>
            </p>
          )}
        </div>

        {/* 数据管理入口 */}
        <div className="border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDataManager();
            }}
            className="flex items-center gap-3 w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-accent/40 hover:bg-accent/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Database size={18} />
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-900">数据管理</span>
              <span className="block text-xs text-gray-500">保存到本地文件，或导入/导出 JSON 备份</span>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
};
