import React, { useState, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useStore } from '../store';
import { Button } from './Button';
import { Modal } from './Modal';

export const Sidebar: React.FC = () => {
  const location = useLocation();
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
    deleteFolder,
    deleteGroup,
  } = useStore();

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  
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

  // 创建词组
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const group = addGroup({ name: newGroupName.trim(), desc: '' }, selectedFolderId || undefined);
    setShowCreateGroupModal(false);
    setNewGroupName('');
    setSelectedFolderId(null);
    setContextMenu(null);
    // 跳转到新词组页面
    window.location.href = `/group/${group.id}`;
  };

  // 创建目录
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder(newFolderName.trim());
    setShowCreateFolderModal(false);
    setNewFolderName('');
    setContextMenu(null);
  };

  // 更新目录名
  const handleUpdateFolder = () => {
    if (!editingFolderName.trim() || !editingFolderId) return;
    updateFolder(editingFolderId, editingFolderName.trim());
    setEditingFolderId(null);
    setEditingFolderName('');
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
    if (folder && confirm(`确定删除目录「${folder.name}」吗？该目录下的词组将移到根目录。`)) {
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

  if (sidebarCollapsed) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 w-7 h-16 bg-white border border-gray-200 border-l-0 rounded-r-lg flex items-center justify-center text-gray-400 hover:text-accent transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    );
  }

  return (
    <>
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-40">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2 text-gray-900 font-semibold">
            <LayoutDashboard size={20} className="text-accent" />
            <span>提示词管理</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-accent hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {/* 工作空间 */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              <ChevronRight size={10} className="transform rotate-90" />
              <span>工作空间</span>
            </div>
            {workspaces.length > 0 ? (
              workspaces.map((ws) => (
                <Link
                  key={ws.id}
                  to={`/workspace/${ws.id}`}
                  className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm transition-colors ${
                    isActive(`/workspace/${ws.id}`)
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: `oklch(58% 0.18 ${ws.color})` }}
                  />
                  <span className="truncate">{ws.name}</span>
                </Link>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-gray-400">暂无工作空间</p>
            )}
          </div>

          {/* 词组 */}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              <div className="flex items-center gap-1">
                <ChevronRight size={10} className="transform rotate-90" />
                <span>词组</span>
              </div>
            </div>

            {/* 目录 */}
            {folders.map((folder) => (
              <div key={folder.id}>
                <div 
                  className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500"
                  onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id)}
                >
                  <ChevronRight size={8} className="transform rotate-90" />
                  <FolderOpen size={12} />
                  {editingFolderId === folder.id ? (
                    <input
                      type="text"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onBlur={handleUpdateFolder}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateFolder()}
                      className="flex-1 px-1 py-0.5 border border-accent rounded text-xs"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="flex-1 cursor-pointer hover:text-gray-900"
                      onClick={() => {
                        setEditingFolderId(folder.id);
                        setEditingFolderName(folder.name);
                      }}
                    >
                      {folder.name}
                    </span>
                  )}
                </div>
                {groups
                  .filter((g) => groupFolderMap[g.id] === folder.id)
                  .map((group) => (
                    <Link
                      key={group.id}
                      to={`/group/${group.id}`}
                      className={`flex items-center gap-2 px-3 py-1.5 ml-4 rounded-md text-sm transition-colors ${
                        isGroupActive(group.id)
                          ? 'bg-accent/10 text-accent font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onContextMenu={(e) => handleContextMenu(e, 'group', group.id)}
                    >
                      <FileText size={12} className="text-gray-400" />
                      <span className="truncate flex-1">{group.name}</span>
                      <span className="text-xs text-gray-400">{getGroupTagCount(group.id)}</span>
                    </Link>
                  ))}
              </div>
            ))}

            {/* 根目录词组 */}
            {groups
              .filter((g) => !groupFolderMap[g.id])
              .map((group) => (
                <Link
                  key={group.id}
                  to={`/group/${group.id}`}
                  className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm transition-colors ${
                    isGroupActive(group.id)
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onContextMenu={(e) => handleContextMenu(e, 'group', group.id)}
                >
                  <FileText size={12} className="text-gray-400" />
                  <span className="truncate flex-1">{group.name}</span>
                  <span className="text-xs text-gray-400">{getGroupTagCount(group.id)}</span>
                </Link>
              ))}

            {/* 词组区域空白处右键菜单触发区 */}
            <div 
              className="h-2"
              onContextMenu={(e) => handleContextMenu(e, 'empty')}
            />
          </div>

          {/* 提示词 */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              <ChevronRight size={10} className="transform rotate-90" />
              <span>提示词</span>
            </div>
            <Link
              to="/tags"
              className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm transition-colors ${
                isActive('/tags')
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Tag size={12} className="text-gray-400" />
              <span className="truncate flex-1">全部提示词</span>
              <span className="text-xs text-gray-400">{tags.length}</span>
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 flex gap-2">
          <Link
            to="/"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-accent hover:bg-gray-50"
          >
            <Home size={16} />
          </Link>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-accent hover:bg-gray-50">
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
                onClick={() => {
                  setSelectedFolderId(null);
                  setShowCreateGroupModal(true);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus size={12} />
                新建词组
              </button>
              <button
                onClick={() => setShowCreateFolderModal(true)}
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
                onClick={() => {
                  setSelectedFolderId(null);
                  setShowCreateGroupModal(true);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus size={12} />
                新建词组
              </button>
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus size={12} />
                新建目录
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
                onClick={() => {
                  setSelectedFolderId(contextMenu.targetId);
                  setShowCreateGroupModal(true);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus size={12} />
                在目录中新建词组
              </button>
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus size={12} />
                新建目录
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
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
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
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateFolderModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateFolder}>创建</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};