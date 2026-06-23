import React, { useState, useEffect } from 'react';
import { Sparkles, WandSparkles, MousePointer2, HardDrive, Download, Upload, FilePlus, Clock, EyeOff } from 'lucide-react';
import { useStore, bindDataFile, unbindDataFile } from '../store';
import { Modal } from './Modal';
import { Button } from './Button';
import {
  getSavedDataFileHandle,
  createDataFile,
  downloadSnapshot,
  readSnapshotFromUpload,
} from '../services/localDataFile';
import type { CursorMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const cursorMode = useStore((s) => s.cursorMode);
  const setCursorMode = useStore((s) => s.setCursorMode);
  const syncInterval = useStore((s) => s.syncInterval);
  const setSyncInterval = useStore((s) => s.setSyncInterval);
  const showR18Category = useStore((s) => s.showR18Category);
  const setShowR18Category = useStore((s) => s.setShowR18Category);
  const importData = useStore((s) => s.importData);
  const exportData = useStore((s) => s.exportData);
  const [syncEnabled, setSyncEnabled] = useState(() => {
    // 从 localStorage 恢复同步状态
    try {
      return localStorage.getItem('grain_sync_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [syncFileName, setSyncFileName] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState('');
  const [workModeLoading, setWorkModeLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const loadFileHandle = async () => {
      // 只有在同步已开启的情况下才自动绑定文件
      const isSyncEnabled = localStorage.getItem('grain_sync_enabled') === 'true';
      if (!isSyncEnabled) {
        setSyncFileName(null);
        setSyncEnabled(false);
        return;
      }
      const h = await getSavedDataFileHandle();
      if (h) {
        setSyncFileName(h.name);
        setSyncEnabled(true);
        // 自动绑定并启动同步
        await bindDataFile(h);
      } else {
        setSyncFileName(null);
        setSyncEnabled(false);
        localStorage.setItem('grain_sync_enabled', 'false');
      }
    };
    loadFileHandle();
  }, [isOpen]);

  const handleChangeFile = async () => {
    try {
      const handle = await createDataFile();
      await bindDataFile(handle);
      setSyncFileName(handle.name);
      setSyncMsg('已更换文件');
    } catch { /* user cancelled */ }
  };

  const handleExportJson = () => {
    downloadSnapshot(exportData());
    setSyncMsg('已导出 JSON');
  };

  const handleImportJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      importData(await readSnapshotFromUpload(file));
      setSyncMsg('已导入 JSON');
    } catch {
      setSyncMsg('导入失败');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
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

        {/* 内容显示 */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <EyeOff size={16} className="text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-900">内容显示</h4>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
            <div>
              <div className="text-sm font-medium text-gray-900">显示 R18 分类</div>
              <div className="text-xs text-gray-500">开启后，提示词管理、词组和工作空间会显示 R18 分类及其提示词。</div>
            </div>
            <input
              type="checkbox"
              checked={showR18Category}
              onChange={(e) => setShowR18Category(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
            />
          </label>
        </div>

        {/* 工作方式 */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive size={16} className="text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-900">工作方式</h4>
          </div>
          
          <div className="space-y-2">
            {/* 文件同步模式 */}
            <button
              onClick={async () => {
                if (syncEnabled) return;
                setWorkModeLoading(true);
                try {
                  const existing = await getSavedDataFileHandle();
                  const handle = existing || await createDataFile();
                  await bindDataFile(handle);
                  setSyncEnabled(true);
                  setSyncFileName(handle.name);
                  localStorage.setItem('grain_sync_enabled', 'true');
                  setSyncMsg('已切换到文件同步模式');
                } catch {
                  // user cancelled
                } finally {
                  setWorkModeLoading(false);
                }
              }}
              disabled={workModeLoading}
              className={`w-full p-3 rounded-lg border transition-colors text-left flex items-center gap-3 ${
                syncEnabled
                  ? 'border-pink-200 bg-pink-50'
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                syncEnabled ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <FilePlus size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">文件同步</div>
                <div className="text-xs text-gray-500">
                  {syncEnabled 
                    ? `每 ${syncInterval} 秒自动保存到「${syncFileName || 'grain-data.json'}」`
                    : '数据保存到本地文件，可跨设备'}
                </div>
              </div>
              {syncEnabled && (
                <span className="text-xs text-pink-500 font-medium">当前</span>
              )}
            </button>

            {/* 临时使用模式 */}
            <button
              onClick={() => {
                if (!syncEnabled) return;
                if (confirm('关闭后数据将仅保存在浏览器中，确定切换到临时模式吗？')) {
                  unbindDataFile();
                  setSyncEnabled(false);
                  setSyncFileName(null);
                  localStorage.setItem('grain_sync_enabled', 'false');
                  setSyncMsg('已切换到临时模式');
                }
              }}
              className={`w-full p-3 rounded-lg border transition-colors text-left flex items-center gap-3 ${
                !syncEnabled
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                !syncEnabled ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <Clock size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">临时使用</div>
                <div className="text-xs text-gray-500">数据存浏览器，更换设备会丢失。手动清除：DevTools → Application → Local Storage</div>
              </div>
              {!syncEnabled && (
                <span className="text-xs text-gray-500 font-medium">当前</span>
              )}
            </button>
          </div>

          {/* 同步设置 */}
          {syncEnabled && (
            <div className="mt-3 pl-11 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">间隔</label>
                  <input
                    type="number"
                    min={1}
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(Number(e.target.value))}
                    className="w-14 h-7 px-1.5 border border-gray-200 rounded-md text-xs text-center focus:border-accent focus:outline-none"
                  />
                  <span className="text-xs text-gray-400">秒</span>
                </div>
                <button
                  onClick={handleChangeFile}
                  className="text-xs text-accent hover:underline"
                >
                  更换文件
                </button>
              </div>
              <p className="text-xs text-gray-400">
                更换文件后，数据将同步到新的本地文件。原文件不受影响。
              </p>
            </div>
          )}

          {syncMsg && (
            <p className="mt-2 text-xs text-accent pl-11">{syncMsg}</p>
          )}
        </div>

        {/* 导入 / 导出 */}
        <div className="border-t border-gray-100 pt-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">导入 / 导出</h4>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportJson}>
              <Download size={12} />
              导出 JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload size={12} />
              导入 JSON
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => handleImportJson(e.target.files?.[0])}
          />
          <p className="mt-2 text-xs text-gray-400">
            导出为 JSON 文件备份，可在其他浏览器或设备上导入恢复。
          </p>
        </div>
      </div>
    </Modal>
  );
};
