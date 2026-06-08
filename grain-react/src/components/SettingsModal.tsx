import React, { useState, useEffect } from 'react';
import { Sparkles, WandSparkles, MousePointer2, HardDrive, Download, Upload } from 'lucide-react';
import { useStore, bindDataFile, unbindDataFile } from '../store';
import { Modal } from './Modal';
import { Button } from './Button';
import {
  getSavedDataFileHandle,
  isFileSystemAccessSupported,
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
  const importData = useStore((s) => s.importData);
  const exportData = useStore((s) => s.exportData);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncFileName, setSyncFileName] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState('');
  const fsSupported = isFileSystemAccessSupported();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSyncMsg('');
    getSavedDataFileHandle().then((h) => {
      setSyncFileName(h?.name || null);
    });
  }, [isOpen]);

  const handleToggleSync = async (on: boolean) => {
    if (on) {
      try {
        const existing = await getSavedDataFileHandle();
        const handle = existing || await createDataFile();
        await bindDataFile(handle);
        setSyncEnabled(true);
        setSyncFileName(handle.name);
        setSyncMsg('同步已开启');
      } catch {
        setSyncEnabled(false);
      }
    } else {
      unbindDataFile();
      setSyncEnabled(false);
      setSyncFileName(null);
    }
  };

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

        {/* 本地文件同步 */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-900">本地文件同步</h4>
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
              <span className="text-xs text-gray-400">仅 Chrome/Edge</span>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {syncEnabled
              ? `每 ${syncInterval} 秒自动同步到「${syncFileName || 'grain-data.json'}」`
              : '开启后将数据自动保存到本地文件，换设备时可恢复'}
          </p>

          {syncEnabled && (
            <div className="mt-3 flex items-center gap-3">
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
          )}

          {syncMsg && (
            <p className="mt-2 text-xs text-accent">{syncMsg}</p>
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
