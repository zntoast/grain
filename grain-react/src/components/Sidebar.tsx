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
} from 'lucide-react';
import { useStore } from '../store';
import { Button } from './Button';
import { Modal } from './Modal';
import { SettingsModal } from './SettingsModal';
import type { Folder, Group } from '../types';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    workspaces,
    groups,
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
  } = useStore();

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
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
  const [openSections, setOpenSections] = useState({
    workspaces: true,
    groups: true,
    tags: true,
  });
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'group' | 'folder' | 'empty';
    targetId: string | null;
  } | null>(null);

  const getGroupTagCount = (groupId: string) => groupTags[groupId]?.length || 0;
  const rootFolders = folders.filter((folder) => !folder.parentId);
  const rootGroups = groups.filter((group) => !groupFolderMap[group.id]);
  const getChildFolders = (folderId: string) => folders.filter((folder) => folder.parentId === folderId);
  const getGroupsInFolder = (folderId: string) => groups.filter((group) => groupFolderMap[group.id] === folderId);
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

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const group = addGroup({ name: newGroupName.trim(), desc: '' }, selectedFolderId || undefined);
    setShowCreateGroupModal(false);
    setNewGroupName('');
    setSelectedFolderId(null);
    setContextMenu(null);
    navigate(`/group/${group.id}`);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder(newFolderName.trim(), selectedFolderId || undefined);
    setShowCreateFolderModal(false);
    setNewFolderName('');
    setSelectedFolderId(null);
    setContextMenu(null);
  };

  const handleUpdateFolder = () => {
    if (!editingFolderName.trim() || !editingFolderId) return;
    updateFolder(editingFolderId, editingFolderName.trim());
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleUpdateGroup = () => {
    if (!editingGroupName.trim() || !editingGroupId) return;
    updateGroup(editingGroupId, { name: editingGroupName.trim() });
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group && confirm(`确定删除词组「${group.name}」吗？`)) {
      deleteGroup(groupId);
      setContextMenu(null);
    }
  };

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

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (groupId: string) => location.pathname === `/group/${groupId}`;
  const toggleSection = (section: keyof typeof openSections) => setOpenSections((c) => ({ ...c, [section]: !c[section] }));
  const toggleFolder = (folderId: string) => setOpenFolders((c) => ({ ...c, [folderId]: c[folderId] === false }));
  const isFolderOpen = (folderId: string) => openFolders[folderId] !== false;

  const handleContextMenu = useCallback((e: React.MouseEvent, type: 'group' | 'folder' | 'empty', targetId: string | null = null) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, targetId });
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close, { passive: true });
    document.addEventListener('contextmenu', close, { passive: true });
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('contextmenu', close);
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
          isGroupActive(group.id) ? 'nav-active sidebar-link-active font-semibold' : ''
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
        <span className="sidebar-dot" />
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
          <button onClick={() => toggleFolder(folder.id)} className="w-5 h-5 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-white" aria-label={isOpen ? '折叠目录' : '展开目录'}>
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
            <span className="flex-1 min-w-0 truncate cursor-pointer hover:text-gray-900" onClick={() => beginRenameFolder(folder)}>
              {folder.name}
            </span>
          )}
        </div>
        {isOpen && (
          <div className="space-y-1">
            {childFolders.map((child) => <div key={child.id} className="ml-4">{renderFolderBlock(child)}</div>)}
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
          <button onClick={toggleSidebar} className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-semibold shadow-sm" title="展开侧边栏">
            G
          </button>
        </div>
        <nav className="flex-1 py-3 flex flex-col items-center gap-1.5">
          <Link to="/" title="首页" className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors sidebar-collapsed-icon ${isActive('/') ? 'sidebar-link-active' : ''}`}><Home size={18} /></Link>
          <Link to={`/workspace/${workspaces[0]?.id || 'ws_main'}`} title="工作空间" className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors sidebar-collapsed-icon ${location.pathname.startsWith('/workspace') ? 'sidebar-link-active' : ''}`}><LayoutDashboard size={18} /></Link>
          <Link to={`/group/${groups[0]?.id || 'people'}`} title="词组" className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors sidebar-collapsed-icon ${location.pathname.startsWith('/group') ? 'sidebar-link-active' : ''}`}><FolderOpen size={18} /></Link>
          <Link to="/tags" title="全部提示词" className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors sidebar-collapsed-icon ${isActive('/tags') || location.pathname.startsWith('/tag') ? 'sidebar-link-active' : ''}`}><Tag size={18} /></Link>
        </nav>
        <div className="p-3 border-t sidebar-divider">
          <button onClick={toggleSidebar} className="w-10 h-10 rounded-xl sidebar-footer-btn flex items-center justify-center transition-colors" title="展开侧边栏"><PanelLeftOpen size={18} /></button>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside className="w-[272px] flex-shrink-0 sidebar-warm flex flex-col h-screen sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14 border-b sidebar-divider">
          <Link to="/" className="flex items-center gap-2.5 text-gray-900 font-semibold">
            <span className="w-1 h-5 rounded-full bg-accent" />
            <span className="text-[15px] tracking-tight">Grain 提示词</span>
          </Link>
          <button onClick={toggleSidebar} className="w-8 h-8 flex items-center justify-center rounded-lg sidebar-footer-btn transition-colors" title="收起侧边栏">
            <ChevronLeft size={14} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <section className="pb-3 mb-3 border-b sidebar-divider nav-section-workspace">
            <button onClick={() => toggleSection('workspaces')} className="w-full flex items-center justify-between px-2 py-1.5 text-[12px] font-semibold sidebar-section-title hover:text-gray-800 rounded-lg transition-colors" aria-expanded={openSections.workspaces}>
              <span className="flex items-center gap-2"><LayoutDashboard size={14} className="nav-icon sidebar-section-icon" />工作空间</span>
              <ChevronRight size={14} className={`text-gray-400 transition-transform ${openSections.workspaces ? 'rotate-90' : ''}`} />
            </button>
            {openSections.workspaces && workspaces.length > 0 ? (
              workspaces.map((ws) => (
                <Link key={ws.id} to={`/workspace/${ws.id}`} className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] leading-5 transition-colors sidebar-link ${isActive(`/workspace/${ws.id}`) ? 'nav-active sidebar-link-active font-semibold' : ''}`}>
                  <span className="truncate">{ws.name}</span>
                  <span className="sidebar-dot" />
                </Link>
              ))
            ) : openSections.workspaces ? (
              <p className="px-3 py-2 text-[13px] text-gray-400">暂无工作空间</p>
            ) : null}
          </section>

          <section className="pb-3 mb-3 border-b sidebar-divider nav-section-group">
            <button onClick={() => toggleSection('groups')} className="w-full flex items-center justify-between px-2 py-1.5 text-[12px] font-semibold sidebar-section-title hover:text-gray-800 rounded-lg transition-colors" aria-expanded={openSections.groups}>
              <span className="flex items-center gap-2"><FolderOpen size={14} className="nav-icon sidebar-section-icon" />词组</span>
              <ChevronRight size={14} className={`text-gray-400 transition-transform ${openSections.groups ? 'rotate-90' : ''}`} />
            </button>
            {openSections.groups && (
              <div className="max-h-[360px] space-y-1 overflow-y-auto overscroll-contain pr-1">
                {rootFolders.map((folder) => renderFolderBlock(folder))}
                {rootGroups.map((group) => renderGroupLink(group))}
                <div className="h-2" onContextMenu={(e) => handleContextMenu(e, 'empty')} />
              </div>
            )}
          </section>

          <section className="nav-section-tag">
            <Link to="/tags" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] leading-5 transition-colors sidebar-link ${isActive('/tags') || location.pathname.startsWith('/tag') ? 'nav-active sidebar-link-active font-semibold' : ''}`}>
              <Tag size={14} className="nav-icon" />
              <span className="truncate">提示词管理</span>
              <span className="sidebar-dot" />
            </Link>
          </section>
        </nav>

        <div className="p-3 border-t sidebar-footer flex gap-2">
          <Link to="/" className="w-9 h-9 flex items-center justify-center rounded-lg sidebar-footer-btn transition-colors" title="首页"><Home size={16} /></Link>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg sidebar-footer-btn transition-colors" title="设置" onClick={() => setShowSettingsModal(true)}><Settings size={16} /></button>
        </div>
      </aside>

      {contextMenu && (
        <div className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]" style={{ left: contextMenu.x, top: contextMenu.y }}>
          {contextMenu.type === 'empty' && (
            <>
              <button onClick={() => beginCreateGroup(null)} className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Plus size={12} />新建词组</button>
              <button onClick={() => beginCreateFolder(null)} className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Plus size={12} />新建目录</button>
            </>
          )}
          {contextMenu.type === 'group' && contextMenu.targetId && (
            <>
              <button onClick={() => beginCreateGroup(groupFolderMap[contextMenu.targetId!] || null)} className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Plus size={12} />新建词组</button>
              <button onClick={() => beginMoveGroup(contextMenu.targetId!)} className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><ChevronRight size={12} />移动到目录</button>
              <div className="border-t border-gray-100 my-1" />
              <button onClick={() => handleDeleteGroup(contextMenu.targetId!)} className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} />删除词组</button>
            </>
          )}
          {contextMenu.type === 'folder' && contextMenu.targetId && (
            <>
              <button onClick={() => beginCreateGroup(contextMenu.targetId)} className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Plus size={12} />新建词组</button>
              {getFolderLevel(contextMenu.targetId) === 0 && (
                <button onClick={() => beginCreateFolder(contextMenu.targetId)} className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Plus size={12} />新建子目录</button>
              )}
              <button onClick={() => { const f = folders.find((i) => i.id === contextMenu.targetId); if (f) beginRenameFolder(f); }} className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Settings size={12} />重命名目录</button>
              <div className="border-t border-gray-100 my-1" />
              <button onClick={() => handleDeleteFolder(contextMenu.targetId!)} className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} />删除目录</button>
            </>
          )}
        </div>
      )}

      <Modal isOpen={Boolean(movingGroupId)} onClose={() => { setMovingGroupId(null); setMoveTargetFolderId(''); }} title="移动词组" description={`将「${groups.find((g) => g.id === movingGroupId)?.name || '词组'}」移动到指定目录`}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">目标目录</label>
            <select value={moveTargetFolderId} onChange={(e) => setMoveTargetFolderId(e.target.value)} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none">
              <option value="">（根目录）</option>
              {rootFolders.map((folder) => (
                <React.Fragment key={folder.id}>
                  <option value={folder.id}>{folder.name}</option>
                  {getChildFolders(folder.id).map((child) => <option key={child.id} value={child.id}>└ {child.name}</option>)}
                </React.Fragment>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => { setMovingGroupId(null); setMoveTargetFolderId(''); }}>取消</Button>
            <Button onClick={handleMoveGroupToFolder}>移动</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCreateGroupModal} onClose={() => setShowCreateGroupModal(false)} title="新建词组" description="创建新词组并打开">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">词组名称</label>
            <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="例如：人物肖像" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none" autoFocus />
          </div>
          {selectedFolderId && <p className="text-xs text-gray-400">将在目录「{folders.find((f) => f.id === selectedFolderId)?.name}」下创建</p>}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateGroupModal(false)}>取消</Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>创建</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCreateFolderModal} onClose={() => setShowCreateFolderModal(false)} title="新建目录" description="创建目录来组织词组">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">目录名称</label>
            <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="例如：设计素材" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">父目录（可选）</label>
            <select value={selectedFolderId || ''} onChange={(e) => setSelectedFolderId(e.target.value || null)} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none">
              <option value="">（无父目录 — 创建一级目录）</option>
              {rootFolders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-400">目录最多支持两级，二级目录下不能再创建目录。</p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateFolderModal(false)}>取消</Button>
            <Button onClick={handleCreateFolder}>创建</Button>
          </div>
        </div>
      </Modal>

      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </>
  );
};
