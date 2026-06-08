import React, { useState, useCallback, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Tag,
  Plus,
  ChevronRight,
  ChevronLeft,
  Settings,
  FileText,
  Home,
  Trash2,
  PanelLeftOpen,
  Save,
  Download,
  Upload,
  FileJson,
} from 'lucide-react';
import { useStore } from '../store';
import { Button } from './Button';
import { Modal } from './Modal';
import { SettingsModal } from './SettingsModal';
import {
  chooseExistingDataFile,
  createDataFile,
  downloadSnapshot,
  getSavedDataFileHandle,
  isFileSystemAccessSupported,
  readSnapshotFromUpload,
  writeSnapshotToFile,
  type GrainFileHandle,
} from '../services/localDataFile';
import { bindDataFile } from '../store';
import type { Folder, Group } from '../types';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    workspaces,
    groups,
    tags,
    folders,
    groupFolderMap,
    groupTags,
    sidebarCollapsed,
    toggleSidebar,
    addGroup,
    addFolder,
    updateFolder,
    updateGroup,
    deleteFolder,
    deleteGroup,
    moveGroupToFolder,
    exportData,
    importData,
  } = useStore();

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [movingGroupId, setMovingGroupId] = useState<string | null>(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState('');
  const [dataFileName, setDataFileName] = useState<string | null>(null);
  const [dataMessage, setDataMessage] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [openSections, setOpenSections] = useState({
    workspaces: true,
    groups: true,
    tags: true,
  });
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'group' | 'folder' | 'empty';
    targetId: string | null;
  } | null>(null);

  // 获取当前工作空间的词组数量
  const getGroupTagCount = (groupId: string) => {
    return groupTags[groupId]?.length || 0;
  };

  const rootFolders = folders.filter((folder) => !folder.parentId);
  const rootGroups = groups.filter((group) => !groupFolderMap[group.id]);

  const getChildFolders = (folderId: string) => {
    return folders.filter((folder) => folder.parentId === folderId);
  };

  const getGroupsInFolder = (folderId: string) => {
    return groups.filter((group) => groupFolderMap[group.id] === folderId);
  };

  const getFolderLevel = (folderId: string | null) => {
    if (!folderId) return -1;
    const folder = folders.find((item) => item.id === folderId);
    return folder?.parentId ? 1 : 0;
  };

  const beginCreateGroup = (folderId?: string | null) => {
    setSelectedFolderId(folderId || null);
    setShowCreateGroupModal(true);
    setContextMenu(null);
  };

  const beginCreateFolder = (parentId?: string | null) => {
    if (parentId && getFolderLevel(parentId) >= 1) return;
    setSelectedFolderId(parentId || null);
    setShowCreateFolderModal(true);
    setContextMenu(null);
  };

  const beginRenameFolder = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
    setContextMenu(null);
  };

  const beginMoveGroup = (groupId: string) => {
    setMovingGroupId(groupId);
    setMoveTargetFolderId(groupFolderMap[groupId] || '');
    setContextMenu(null);
  };

  const handleMoveGroupToFolder = () => {
    if (!movingGroupId) return;
    moveGroupToFolder(movingGroupId, moveTargetFolderId || undefined);
    setMovingGroupId(null);
    setMoveTargetFolderId('');
  };

  const fileSystemSupported = typeof window !== 'undefined' && isFileSystemAccessSupported();

  useEffect(() => {
    if (!showDataModal || !fileSystemSupported) return;
    getSavedDataFileHandle().then((handle) => {
      setDataFileName(handle?.name || null);
    });
  }, [fileSystemSupported, showDataModal]);

  const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : '操作失败，请重试';
  };

  const handleRememberFile = async (operation: () => Promise<GrainFileHandle>, successMessage: string) => {
    try {
      const handle = await operation();
      setDataFileName(handle.name);
      setDataMessage(successMessage);
      // 绑定文件并启动 10 秒自动同步
      try {
        await bindDataFile(handle);
      } catch { /* ignore bind errors */ }
      return handle;
    } catch (error) {
      setDataMessage(getErrorMessage(error));
      return null;
    }
  };

  const handleChooseDataFile = async () => {
    await handleRememberFile(chooseExistingDataFile, '已选择本地数据文件');
  };

  const handleCreateDataFile = async () => {
    const handle = await handleRememberFile(createDataFile, '已创建并绑定本地数据文件（每10秒自动同步中）');
    if (!handle) return;
    try {
      await writeSnapshotToFile(handle, exportData());
      setDataMessage('已创建文件（每10秒自动同步中）');
    } catch (error) {
      setDataMessage(getErrorMessage(error));
    }
  };

  const handleSaveToLocalFile = async () => {
    try {
      const handle = (await getSavedDataFileHandle()) || (await createDataFile());
      await writeSnapshotToFile(handle, exportData());
      setDataFileName(handle.name);
      setDataMessage('已保存到本地数据文件（每10秒自动同步中）');
    } catch (error) {
      setDataMessage(getErrorMessage(error));
    }
  };

  const handleLoadFromLocalFile = async () => {
    try {
      const handle = (await getSavedDataFileHandle()) || (await chooseExistingDataFile());
      await bindDataFile(handle);
      setDataFileName(handle.name);
      setDataMessage('已从本地数据文件读取（每10秒自动同步中）');
    } catch (error) {
      setDataMessage(getErrorMessage(error));
    }
  };

  const handleExportJson = () => {
    downloadSnapshot(exportData());
    setDataMessage('已导出 JSON 备份');
  };

  const handleImportJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      importData(await readSnapshotFromUpload(file));
      setDataMessage('已导入 JSON 数据');
    } catch (error) {
      setDataMessage(getErrorMessage(error));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 创建词组
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const group = addGroup({ name: newGroupName.trim(), desc: '' }, selectedFolderId || undefined);
    setShowCreateGroupModal(false);
    setNewGroupName('');
    setSelectedFolderId(null);
    setContextMenu(null);
    navigate(`/group/${group.id}`);
  };

  // 创建目录
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder(newFolderName.trim(), selectedFolderId || undefined);
    setShowCreateFolderModal(false);
    setNewFolderName('');
    setSelectedFolderId(null);
    setContextMenu(null);
  };

  // 更新目录名
  const handleUpdateFolder = () => {
    if (!editingFolderName.trim() || !editingFolderId) return;
    updateFolder(editingFolderId, editingFolderName.trim());
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  // 更新词组名
  const handleUpdateGroup = () => {
    if (!editingGroupName.trim() || !editingGroupId) return;
    updateGroup(editingGroupId, { name: editingGroupName.trim() });
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  // 删除词组
  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group && confirm(`确定删除词组「${group.name}」吗？`)) {
      deleteGroup(groupId);
      setContextMenu(null);
    }
  };

  // 删除目录
  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    const message = folder.parentId
      ? `确定删除目录「${folder.name}」吗？该目录下的词组将移到上级目录。`
      : `确定删除目录「${folder.name}」吗？子目录会一并移除，目录内词组将移到根目录。`;
    if (confirm(message)) {
      deleteFolder(folderId);
      setContextMenu(null);
    }
  };

  // 判断当前路由
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isGroupActive = (groupId: string) => {
    return location.pathname === `/group/${groupId}`;
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders((current) => ({ ...current, [folderId]: current[folderId] === false }));
  };

  const isFolderOpen = (folderId: string) => openFolders[folderId] !== false;

  // 处理右键点击
  const handleContextMenu = useCallback((e: React.MouseEvent, type: 'group' | 'folder' | 'empty', targetId: string | null = null) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      targetId,
    });
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
    };
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      document.addEventListener('contextmenu', handleClick);
    }
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleClick);
    };
  }, [contextMenu]);

  const renderGroupLink = (group: Group, className = '') => {
    if (editingGroupId === group.id) {
      return (
        <div key={group.id} className={`flex items-center gap-2.5 px-3 py-2 ${className}`}>
          <FileText size={14} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={editingGroupName}
            onChange={(e) => setEditingGroupName(e.target.value)}
            onBlur={handleUpdateGroup}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdateGroup()}
            onKeyUp={(e) => e.key === 'Escape' && (setEditingGroupId(null), setEditingGroupName(''))}
            className="flex-1 min-w-0 px-2 py-1 border border-accent rounded-md text-[14px] bg-white outline-none"
            autoFocus
          />
          <span className="text-[12px] text-gray-400 tabular-nums">{getGroupTagCount(group.id)}</span>
        </div>
      );
    }

    return (
      <div
        key={group.id}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] leading-5 transition-colors sidebar-link cursor-pointer ${
          isGroupActive(group.id)
            ? 'nav-active sidebar-link-active font-semibold'
            : ''
        } ${className}`}
        onClick={() => navigate(`/group/${group.id}`)}
        onDoubleClick={(e) => {
          e.preventDefault();
          setEditingGroupId(group.id);
          setEditingGroupName(group.name);
          setContextMenu(null);
        }}
        onContextMenu={(e) => handleContextMenu(e, 'group', group.id)}
      >
        <FileText size={14} className="text-gray-400 flex-shrink-0" />
        <span className="truncate flex-1">{group.name}</span>
        <span className="text-[12px] text-gray-400 tabular-nums">{getGroupTagCount(group.id)}</span>
      </div>
    );
  };

  const renderFolderBlock = (folder: Folder) => {
    const childFolders = getFolderLevel(folder.id) === 0 ? getChildFolders(folder.id) : [];
    const folderGroups = getGroupsInFolder(folder.id);
    const isOpen = isFolderOpen(folder.id);

    return (
      <div key={folder.id}>
        <div
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-semibold text-gray-500 hover:bg-gray-50"
          onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id)}
        >
          <button
            onClick={() => toggleFolder(folder.id)}
            className="w-5 h-5 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-white"
            aria-label={isOpen ? '折叠目录' : '展开目录'}
          >
            <ChevronRight size={12} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </button>
          <FolderOpen size={13} className="text-gray-400" />
          {editingFolderId === folder.id ? (
            <input
              type="text"
              value={editingFolderName}
              onChange={(e) => setEditingFolderName(e.target.value)}
              onBlur={handleUpdateFolder}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateFolder()}
              className="flex-1 min-w-0 px-2 py-1 border border-accent rounded-md text-[13px] bg-white outline-none"
              autoFocus
            />
          ) : (
            <span
              className="flex-1 min-w-0 truncate cursor-pointer hover:text-gray-900"
              onClick={() => beginRenameFolder(folder)}
            >
              {folder.name}
            </span>
          )}
        </div>

        {isOpen && (
          <div className="space-y-1">
            {childFolders.map((childFolder) => (
              <div key={childFolder.id} className="ml-4">
                {renderFolderBlock(childFolder)}
              </div>
            ))}
            {folderGroups.map((group) => renderGroupLink(group, 'ml-4'))}
          </div>
        )}
      </div>
    );
  };

  if (sidebarCollapsed) {
    return (
      <aside className="w-16 flex-shrink-0 sidebar-collapsed-warm flex flex-col h-screen sticky top-0 z-40">
        <div className="h-14 flex items-center justify-center border-b sidebar-divider">
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-semibold shadow-sm"
            title="展开侧边栏"
            aria-label="展开侧边栏"
          >
            G
          </button>
        </div>
        <nav className="flex-1 py-3 flex flex-col items-center gap-1.5">
          <Link
            to="/"
            title="首页"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors sidebar-collapsed-icon ${
              isActive('/') ? 'sidebar-link-active' : ''
            }`}
          >
            <Home size={18} />
          </Link>
          <Link
            to={`/workspace/${workspaces[0]?.id || 'ws_main'}`}
            title="工作空间"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors sidebar-collapsed-icon ${
              location.pathname.startsWith('/workspace') ? 'sidebar-link-active' : ''
            }`}
          >
            <LayoutDashboard size={18} />
          </Link>
          <Link
            to={`/group/${groups[0]?.id || 'people'}`}
            title="词组"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors sidebar-collapsed-icon ${
              location.pathname.startsWith('/group') ? 'sidebar-link-active' : ''
            }`}
          >
            <FolderOpen size={18} />
          </Link>
          <Link
            to="/tags"
            title="全部提示词"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors sidebar-collapsed-icon ${
              isActive('/tags') || location.pathname.startsWith('/tag') ? 'sidebar-link-active' : ''
            }`}
          >
            <Tag size={18} />
          </Link>
        </nav>
        <div className="p-3 border-t sidebar-divider">
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 rounded-xl sidebar-footer-btn flex items-center justify-center transition-colors"
            title="展开侧边栏"
            aria-label="展开侧边栏"
          >
            <PanelLeftOpen size={18} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside className="w-[272px] flex-shrink-0 sidebar-warm flex flex-col h-screen sticky top-0 z-40">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b sidebar-divider">
          <Link to="/" className="flex items-center gap-2.5 text-gray-900 font-semibold">
            <span className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center text-sm font-bold shadow-sm">
              G
            </span>
            <span className="text-[15px] tracking-tight">Grain 提示词</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 flex items-center justify-center rounded-lg sidebar-footer-btn transition-colors"
            title="收起侧边栏"
            aria-label="收起侧边栏"
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {/* 工作空间 */}
          <section className="pb-3 mb-3 border-b sidebar-divider nav-section-workspace">
            <button
              onClick={() => toggleSection('workspaces')}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[12px] font-semibold sidebar-section-title hover:text-gray-800 rounded-lg transition-colors"
              aria-expanded={openSections.workspaces}
            >
              <span className="flex items-center gap-2">
                <LayoutDashboard size={14} className="nav-icon sidebar-section-icon" />
                工作空间
              </span>
              <ChevronRight
                size={14}
                className={`text-gray-400 transition-transform ${openSections.workspaces ? 'rotate-90' : ''}`}
              />
            </button>
            {openSections.workspaces && workspaces.length > 0 ? (
              workspaces.map((ws) => (
                <Link
                  key={ws.id}
                  to={`/workspace/${ws.id}`}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] leading-5 transition-colors sidebar-link ${
                    isActive(`/workspace/${ws.id}`)
                      ? 'nav-active sidebar-link-active font-semibold'
                      : ''
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: `oklch(58% 0.18 ${ws.color})` }}
                  />
                  <span className="truncate">{ws.name}</span>
                </Link>
              ))
            ) : openSections.workspaces ? (
              <p className="px-3 py-2 text-[13px] text-gray-400">暂无工作空间</p>
            ) : null}
          </section>

          {/* 词组 */}
          <section className="pb-3 mb-3 border-b sidebar-divider nav-section-group">
            <button
              onClick={() => toggleSection('groups')}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[12px] font-semibold sidebar-section-title hover:text-gray-800 rounded-lg transition-colors"
              aria-expanded={openSections.groups}
            >
              <span className="flex items-center gap-2">
                <FolderOpen size={14} className="nav-icon sidebar-section-icon" />
                词组
              </span>
              <ChevronRight
                size={14}
                className={`text-gray-400 transition-transform ${openSections.groups ? 'rotate-90' : ''}`}
              />
            </button>

            {openSections.groups && (
              <div className="max-h-[360px] space-y-1 overflow-y-auto overscroll-contain pr-1">
                {rootFolders.map((folder) => renderFolderBlock(folder))}
                {rootGroups.map((group) => renderGroupLink(group))}

                {/* 词组区域空白处右键菜单触发区 */}
                <div 
                  className="h-2"
                  onContextMenu={(e) => handleContextMenu(e, 'empty')}
                />
              </div>
            )}
          </section>

          {/* 提示词 */}
          <section className="nav-section-tag">
            <button
              onClick={() => toggleSection('tags')}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[12px] font-semibold sidebar-section-title hover:text-gray-800 rounded-lg transition-colors"
              aria-expanded={openSections.tags}
            >
              <span className="flex items-center gap-2">
                <Tag size={14} className="nav-icon sidebar-section-icon" />
                提示词
              </span>
              <ChevronRight
                size={14}
                className={`text-gray-400 transition-transform ${openSections.tags ? 'rotate-90' : ''}`}
              />
            </button>
            {openSections.tags && (
              <Link
                to="/tags"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] leading-5 transition-colors sidebar-link ${
                  isActive('/tags') || location.pathname.startsWith('/tag')
                    ? 'nav-active sidebar-link-active font-semibold'
                    : ''
                }`}
              >
                <Tag size={14} className="text-gray-400 flex-shrink-0" />
                <span className="truncate flex-1">全部提示词</span>
                <span className="text-[12px] text-gray-400 tabular-nums">{tags.length}</span>
              </Link>
            )}
          </section>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t sidebar-footer flex gap-2">
          <Link
            to="/"
            className="w-9 h-9 flex items-center justify-center rounded-lg sidebar-footer-btn transition-colors"
            title="首页"
          >
            <Home size={16} />
          </Link>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg sidebar-footer-btn transition-colors"
            title="设置"
            onClick={() => setShowSettingsModal(true)}
          >
            <Settings size={16} />
          </button>
        </div>
      </aside>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'empty' && (
            <>
              <button
                onClick={() => beginCreateGroup(null)}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus size={12} />
                新建词组
              </button>
              <button
                onClick={() => beginCreateFolder(null)}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus size={12} />
                新建目录
              </button>
            </>
          )}
          {contextMenu.type === 'group' && contextMenu.targetId && (
            <>
              <button
                onClick={() => beginCreateGroup(groupFolderMap[contextMenu.targetId!] || null)}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus size={12} />
                新建词组
              </button>
              <button
                onClick={() => beginMoveGroup(contextMenu.targetId!)}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <ChevronRight size={12} />
                移动到目录
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => handleDeleteGroup(contextMenu.targetId!)}
                className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={12} />
                删除词组
              </button>
            </>
          )}
          {contextMenu.type === 'folder' && contextMenu.targetId && (
            <>
              <button
                onClick={() => beginCreateGroup(contextMenu.targetId)}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus size={12} />
                新建词组
              </button>
              {getFolderLevel(contextMenu.targetId) === 0 && (
                <button
                  onClick={() => beginCreateFolder(contextMenu.targetId)}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Plus size={12} />
                  新建子目录
                </button>
              )}
              <button
                onClick={() => {
                  const folder = folders.find((item) => item.id === contextMenu.targetId);
                  if (folder) beginRenameFolder(folder);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Settings size={12} />
                重命名目录
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => handleDeleteFolder(contextMenu.targetId!)}
                className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={12} />
                删除目录
              </button>
            </>
          )}
        </div>
      )}

      {/* 移动词组弹窗 */}
      <Modal
        isOpen={Boolean(movingGroupId)}
        onClose={() => {
          setMovingGroupId(null);
          setMoveTargetFolderId('');
        }}
        title="移动词组"
        description={`将「${groups.find((group) => group.id === movingGroupId)?.name || '词组'}」移动到指定目录`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">目标目录</label>
            <select
              value={moveTargetFolderId}
              onChange={(e) => setMoveTargetFolderId(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none"
            >
              <option value="">（根目录）</option>
              {rootFolders.map((folder) => (
                <React.Fragment key={folder.id}>
                  <option value={folder.id}>{folder.name}</option>
                  {getChildFolders(folder.id).map((childFolder) => (
                    <option key={childFolder.id} value={childFolder.id}>
                      └ {childFolder.name}
                    </option>
                  ))}
                </React.Fragment>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setMovingGroupId(null);
                setMoveTargetFolderId('');
              }}
            >
              取消
            </Button>
            <Button onClick={handleMoveGroupToFolder}>移动</Button>
          </div>
        </div>
      </Modal>

      {/* 数据管理弹窗 */}
      <Modal
        isOpen={showDataModal}
        onClose={() => setShowDataModal(false)}
        title="数据管理"
        description="保存到本地文件，或导入/导出 JSON 备份"
        width="w-[560px]"
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-accent shadow-sm">
                <FileJson size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900">本地数据文件</div>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {fileSystemSupported
                    ? 'Chrome/Edge 可直接保存到你选择的 JSON 文件。浏览器会在需要时再次请求文件权限。'
                    : '当前浏览器不支持直接写入本地文件，请使用 JSON 导入/导出备份。'}
                </p>
                <div className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-gray-600">
                  当前文件：
                  <span className="font-medium text-gray-900">
                    {dataFileName || (fileSystemSupported ? '未选择' : '不支持直接绑定')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!fileSystemSupported}
              onClick={handleCreateDataFile}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Save size={18} className="text-accent" />
              <span>
                <span className="block text-sm font-semibold text-gray-900">创建数据文件</span>
                <span className="block text-xs text-gray-500">新建 grain-data.json</span>
              </span>
            </button>
            <button
              type="button"
              disabled={!fileSystemSupported}
              onClick={handleChooseDataFile}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <FileJson size={18} className="text-accent" />
              <span>
                <span className="block text-sm font-semibold text-gray-900">选择已有文件</span>
                <span className="block text-xs text-gray-500">绑定本地 JSON</span>
              </span>
            </button>
            <button
              type="button"
              disabled={!fileSystemSupported}
              onClick={handleSaveToLocalFile}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Save size={18} className="text-green-600" />
              <span>
                <span className="block text-sm font-semibold text-gray-900">保存到本地</span>
                <span className="block text-xs text-gray-500">写入当前数据</span>
              </span>
            </button>
            <button
              type="button"
              disabled={!fileSystemSupported}
              onClick={handleLoadFromLocalFile}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Upload size={18} className="text-blue-600" />
              <span>
                <span className="block text-sm font-semibold text-gray-900">从本地读取</span>
                <span className="block text-xs text-gray-500">恢复文件内容</span>
              </span>
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="mb-3 text-xs font-semibold text-gray-500">JSON 备份</div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleExportJson}>
                <Download size={14} />
                导出 JSON
              </Button>
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} />
                导入 JSON
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => handleImportJson(event.target.files?.[0])}
              />
            </div>
          </div>

          {dataMessage && (
            <div className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
              {dataMessage}
            </div>
          )}
        </div>
      </Modal>

      {/* 创建词组弹窗 */}
      <Modal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        title="新建词组"
        description="创建一个新的提示词词组"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">词组名称</label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="例如：风景摄影"
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">所属目录（可选）</label>
            <select
              value={selectedFolderId || ''}
              onChange={(e) => setSelectedFolderId(e.target.value || null)}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none"
            >
              <option value="">（无目录 — 放在根目录）</option>
              {rootFolders.map((folder) => (
                <React.Fragment key={folder.id}>
                  <option value={folder.id}>{folder.name}</option>
                  {getChildFolders(folder.id).map((childFolder) => (
                    <option key={childFolder.id} value={childFolder.id}>
                      └ {childFolder.name}
                    </option>
                  ))}
                </React.Fragment>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateGroupModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateGroup}>创建</Button>
          </div>
        </div>
      </Modal>

      {/* 创建目录弹窗 */}
      <Modal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        title="新建目录"
        description="创建一个词组目录"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">目录名称</label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="例如：人物相关"
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">父目录（可选）</label>
            <select
              value={selectedFolderId || ''}
              onChange={(e) => setSelectedFolderId(e.target.value || null)}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none"
            >
              <option value="">（无父目录 — 创建一级目录）</option>
              {rootFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">目录最多支持两级，二级目录下不能再创建目录。</p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateFolderModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateFolder}>创建</Button>
          </div>
        </div>
      </Modal>

      {/* 设置弹窗 */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onOpenDataManager={() => {
          setShowDataModal(true);
          setDataMessage('');
        }}
      />
    </>
  );
};
