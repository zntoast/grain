import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Tag, ArrowRight, Sparkles, FilePlus, FolderInput, Clock, RefreshCw } from 'lucide-react';
import { useStore } from '../store';
import { bindDataFile } from '../store';
import { Modal, Button } from '../components';
import { createDataFile, chooseExistingDataFile, getSavedDataFileHandle, readSnapshotFromFile, readSnapshotFromUpload, writeSnapshotToFile, downloadSnapshot } from '../services/localDataFile';

export const HomePage: React.FC = () => {
  const { workspaces, groups, tags, exportData, importData, setHasCompletedOnboarding } = useStore();
  const navigate = useNavigate();
  const [showWorkModeModal, setShowWorkModeModal] = useState(false);
  const [showSyncReminder, setShowSyncReminder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const features = [
    {
      icon: LayoutDashboard,
      title: '工作空间',
      desc: '按项目组织提示词，正向/负面分组管理',
      link: `/workspace/${workspaces[0]?.id || 'ws_illust'}`,
      color: 'accent',
      count: workspaces.length,
    },
    {
      icon: FolderOpen,
      title: '词组',
      desc: '灵活的提示词集合，支持多工作空间复用',
      link: `/group/${groups[0]?.id || 'subject'}`,
      color: 'green',
      count: groups.length,
    },
    {
      icon: Tag,
      title: '提示词库',
      desc: '230+ 内置提示词，覆盖 10 个分类',
      link: '/tags',
      color: 'orange',
      count: tags.length,
    },
  ];

  const handleCreateNew = async () => {
    setLoading(true);
    setSelectedMode('create');
    try {
      const snapshot = exportData();
      try {
        const fileHandle = await createDataFile();
        await writeSnapshotToFile(fileHandle, snapshot);
      } catch {
        // 浏览器不支持 File System Access API，直接下载 JSON
        downloadSnapshot(snapshot);
      }
      setHasCompletedOnboarding(true);
      setShowWorkModeModal(false);
      navigate(`/workspace/${workspaces[0]?.id || 'ws_illust'}`);
    } catch (error) {
      console.error('Failed to create new workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExisting = async () => {
    setLoading(true);
    setSelectedMode('load');
    try {
      let fileHandle = await getSavedDataFileHandle();
      if (!fileHandle) {
        // 尝试使用 File System Access API 让用户选择文件
        try {
          fileHandle = await chooseExistingDataFile();
        } catch {
          // 浏览器不支持，回退到文件输入
          fileInputRef.current?.click();
          setLoading(false);
          return;
        }
      }
      if (fileHandle) {
        const data = await readSnapshotFromFile(fileHandle);
        importData(data);
        setHasCompletedOnboarding(true);
        setShowWorkModeModal(false);
        setShowSyncReminder(true);
      }
    } catch (error) {
      console.error('Failed to load existing workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await readSnapshotFromUpload(file);
      importData(data);
      setHasCompletedOnboarding(true);
      setShowWorkModeModal(false);
      navigate(`/workspace/${workspaces[0]?.id || 'ws_illust'}`);
    } catch (error) {
      console.error('Failed to import file:', error);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTemporaryUse = () => {
    setSelectedMode('temporary');
    setHasCompletedOnboarding(true);
    setShowWorkModeModal(false);
    navigate(`/workspace/${workspaces[0]?.id || 'ws_illust'}`);
  };

  const handleEnableSync = async () => {
    try {
      const fileHandle = await getSavedDataFileHandle();
      if (fileHandle) {
        await bindDataFile(fileHandle);
        localStorage.setItem('grain_sync_enabled', 'true');
      }
    } catch {
      // ignore
    }
    setShowSyncReminder(false);
    navigate(`/workspace/${workspaces[0]?.id || 'ws_illust'}`);
  };

  const handleSkipSync = () => {
    setShowSyncReminder(false);
    navigate(`/workspace/${workspaces[0]?.id || 'ws_illust'}`);
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_22%_20%,rgba(248,199,216,.34),transparent_48%)]" />
        <div className="relative max-w-4xl mx-auto px-8 pt-14 pb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-[12px] bg-[#e85d91] flex items-center justify-center shadow-[0_2px_0_#bd3d70]">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-sm font-medium text-pink-400 tracking-wide">GRAIN</span>
          </div>
          
          <h1 className="text-[38px] font-bold text-gray-800 tracking-[-0.035em] leading-tight mb-3">
            AI 绘画<span className="text-pink-500">提示词管理</span>
          </h1>
          
          <p className="text-base text-gray-500 max-w-md leading-relaxed mb-6">
            将零散的提示词组织为结构化的工作空间。<br />
            灵活关联，一键复制，高效创作。
          </p>

          <button
            onClick={() => setShowWorkModeModal(true)}
            className="control-press inline-flex items-center gap-2 h-11 px-5 bg-[#e85d91] text-white rounded-[11px] text-sm font-semibold hover:bg-[#d94d82] border border-[#e85d91] shadow-[0_2px_0_#bd3d70]"
          >
            进入
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            const colorMap = {
              accent: { bg: 'bg-pink-50', text: 'text-pink-500', border: 'border-pink-100' },
              green: { bg: 'bg-purple-50', text: 'text-purple-500', border: 'border-purple-100' },
              orange: { bg: 'bg-indigo-50', text: 'text-indigo-500', border: 'border-indigo-100' },
            };
            const colors = colorMap[feature.color as keyof typeof colorMap];
            
            return (
              <Link
                key={feature.title}
                to={feature.link}
                className="surface-card card-hover group relative p-5"
              >
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-3`}>
                  <Icon size={18} className={colors.text} />
                </div>
                
                <h3 className="text-sm font-semibold text-gray-800 mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{feature.desc}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-800">{feature.count}</span>
                  <span className={`text-xs font-medium ${colors.text} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    打开 <ArrowRight size={10} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-10 flex items-center justify-center gap-6 text-xs text-gray-400">
          <span>{workspaces.length} 个工作空间</span>
          <span className="w-px h-3 bg-pink-200" />
          <span>{groups.length} 个词组</span>
          <span className="w-px h-3 bg-pink-200" />
          <span>{tags.length} 个提示词</span>
        </div>
      </div>

      {/* 选择工作方式弹窗 */}
      <Modal isOpen={showWorkModeModal} onClose={() => setShowWorkModeModal(false)} title="选择工作方式" width="w-[480px]">
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-4">请选择您的数据保存方式</p>

          {/* 创建新的工作环境 */}
          <button
            onClick={handleCreateNew}
            disabled={loading}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 text-left ${
              selectedMode === 'create'
                ? 'border-pink-400 bg-pink-50'
                : 'border-gray-100 hover:border-pink-200 hover:bg-pink-50/50'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              selectedMode === 'create' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              <FilePlus size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">创建新的工作环境</h3>
              <p className="text-xs text-gray-500 mt-1">
                将默认提示词模板保存到本地文件，数据可跨设备同步
              </p>
            </div>
          </button>

          {/* 启用现有的工作环境 */}
          <button
            onClick={handleLoadExisting}
            disabled={loading}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 text-left ${
              selectedMode === 'load'
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/50'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              selectedMode === 'load' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              <FolderInput size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">启用现有的工作环境</h3>
              <p className="text-xs text-gray-500 mt-1">
                从之前保存的文件中恢复，或选择一个新的 JSON 文件导入
              </p>
            </div>
          </button>

          {/* 临时使用 */}
          <button
            onClick={handleTemporaryUse}
            disabled={loading}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 text-left ${
              selectedMode === 'temporary'
                ? 'border-gray-400 bg-gray-50'
                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              selectedMode === 'temporary' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              <Clock size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">临时使用</h3>
              <p className="text-xs text-gray-500 mt-1">
                不保存数据，关闭浏览器后内容将丢失
              </p>
            </div>
          </button>

          {/* 说明 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-700">
              <span className="font-medium">数据同步说明：</span>
              创建或启用工作环境后，您的数据将自动保存到本地文件。支持 Edge/Chrome 浏览器的文件系统访问 API。
            </p>
          </div>
        </div>
      </Modal>

      {/* 实时同步提醒 */}
      <Modal isOpen={showSyncReminder} onClose={handleSkipSync} title="开启实时同步？" width="w-[440px]">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            您已成功加载工作环境。是否开启实时同步，让数据自动保存到文件？
          </p>
          
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <RefreshCw size={16} className="text-pink-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">开启实时同步</p>
                <p className="text-xs text-gray-500 mt-0.5">每 30 秒自动保存到本地文件，关闭浏览器也不丢失</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">暂不开启</p>
                <p className="text-xs text-gray-500 mt-0.5">数据仅保存在浏览器中，可稍后在设置中开启</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleSkipSync} className="flex-1">
              暂不开启
            </Button>
            <Button onClick={handleEnableSync} className="flex-1">
              <RefreshCw size={12} />
              开启同步
            </Button>
          </div>
        </div>
      </Modal>

      {/* 隐藏的文件上传 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files?.[0])}
      />
    </div>
  );
};
