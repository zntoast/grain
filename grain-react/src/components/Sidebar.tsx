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
  Pencil,
  GripVertical,
  Check,
  X,
} from 'lucide-react';
import {
  DndContext,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';
import { Button } from './Button';
import { Modal } from './Modal';
import { SettingsModal } from './SettingsModal';
import type { Folder, Group, Workspace } from '../types';

/* ============================================================
   SortableGroupItem — 可拖拽的词组行
   ============================================================ */
interface SortableGroupItemProps {
  group: Group;
  tagCount: number;
  isActive: boolean;
  isEditing: boolean;
  editingName: string;
  onStartEdit: () => void;
  onEditingNameChange: (v: string) => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onNavigate: () => void;
  onMove: () => void;
  onDelete: () => void;
}

const SortableGroupItem: React.FC<SortableGroupItemProps> = ({
  group, tagCount, isActive, isEditing, editingName,
  onStartEdit, onEditingNameChange, onConfirmEdit, onCancelEdit,
  onNavigate, onMove, onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-2 px-3 py-1.5">
        <FileText size={14} className="text-gray-400 flex-shrink-0" />
        <input
          type="text" value={editingName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirmEdit(); if (e.key === 'Escape') onCancelEdit(); }}
          className="flex-1 min-w-0 px-2 py-1 border border-accent rounded-md text-[13px] bg-white outline-none"
          autoFocus
        />
        <button onClick={onConfirmEdit} className="p-0.5 rounded text-green-500 hover:bg-green-50" aria-label="确认重命名" title="确认重命名"><Check size={14} /></button>
        <button onClick={onCancelEdit} className="p-0.5 rounded text-gray-400 hover:bg-gray-100" aria-label="取消重命名" title="取消重命名"><X size={14} /></button>
        <span className="text-[11px] text-gray-400 tabular-nums w-6 text-right">{tagCount}</span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef} style={style}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] leading-5 transition-colors cursor-pointer ${isActive ? 'nav-active sidebar-link-active font-semibold' : 'hover:bg-gray-50'}`}
      onClick={onNavigate}
      onContextMenu={handleContextMenu}
    >
      <button
        {...attributes} {...listeners}
        className="opacity-0 group-hover:opacity-100 cursor-grab text-gray-300 hover:text-gray-500 flex-shrink-0 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        aria-label={`拖拽词组 ${group.name}`}
        title="拖拽排序"
      ><GripVertical size={12} /></button>

      <FileText size={14} className="text-gray-400 flex-shrink-0" />
      <span className="truncate flex-1">{group.name}</span>

      <span className="text-[11px] text-gray-400 tabular-nums w-6 text-right group-hover:hidden">{tagCount}</span>

      {/* 右键菜单 */}
      <div ref={menuRef}>
        {menuOpen && (
          <div className="fixed bg-[#fffefc] border border-[#e8e2e3] rounded-[10px] shadow-[0_12px_32px_rgba(48,32,39,.14)] py-1 z-[100] min-w-[120px]" style={{ left: menuPos.x, top: menuPos.y }}>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onStartEdit(); }} className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Pencil size={12} />重命名</button>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onMove(); }} className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"><ChevronRight size={12} />移动到目录</button>
            <div className="border-t border-gray-100 my-0.5" />
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }} className="w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} />删除词组</button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================
   FolderBlock — 目录块
   ============================================================ */
interface FolderBlockCallbacks {
  toggleFolder: (id: string) => void;
  isFolderOpen: (id: string) => boolean;
  editingFolderId: string | null;
  editingFolderName: string;
  setEditingFolderName: (v: string) => void;
  handleUpdateFolder: () => void;
  setEditingFolderId: (v: string | null) => void;
  beginRenameFolder: (f: Folder) => void;
  beginCreateGroup: (folderId?: string | null) => void;
  beginCreateFolder: (parentId?: string | null) => void;
  handleDeleteFolder: (id: string) => void;
  getFolderLevel: (id: string | null) => number;
  getChildFolders: (id: string) => Folder[];
  getGroupsInFolder: (id: string) => Group[];
  renderGroupItem: (g: Group, cls?: string) => React.ReactNode;
}

const FolderBlock: React.FC<{ folder: Folder; cb: FolderBlockCallbacks }> = ({ folder, cb }) => {
  const droppableId = `folder-${folder.id}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: droppableId, data: { type: 'folder', folderId: folder.id } });
  const childFolders = cb.getFolderLevel(folder.id) === 0 ? cb.getChildFolders(folder.id) : [];
  const folderGroups = cb.getGroupsInFolder(folder.id);
  const isOpen = cb.isFolderOpen(folder.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  };

  return (
    <div ref={setDropRef} className={`rounded-lg transition-colors ${isOver ? 'bg-accent/10 ring-1 ring-accent/30' : ''}`}>
      <div className="group flex items-center gap-1.5 px-2 py-1.5 rounded-[10px] text-[13px] font-semibold text-gray-600 bg-[#f7f3f1] hover:bg-[#f2ece9]" onContextMenu={handleContextMenu}>
        <button onClick={() => cb.toggleFolder(folder.id)} className="w-5 h-5 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-white" aria-label={isOpen ? '折叠' : '展开'}>
          <ChevronRight size={12} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        <FolderOpen size={13} className="text-gray-400" />
        {cb.editingFolderId === folder.id ? (
          <input
            type="text" value={cb.editingFolderName}
            onChange={(e) => cb.setEditingFolderName(e.target.value)}
            onBlur={cb.handleUpdateFolder}
            onKeyDown={(e) => { if (e.key === 'Enter') cb.handleUpdateFolder(); if (e.key === 'Escape') { cb.setEditingFolderId(null); cb.setEditingFolderName(''); } }}
            className="flex-1 min-w-0 px-2 py-1 border border-accent rounded-md text-[13px] bg-white outline-none"
            autoFocus
          />
        ) : (
          <span className="flex-1 min-w-0 truncate cursor-pointer" onClick={() => cb.toggleFolder(folder.id)}>{folder.name}</span>
        )}
        <button onClick={(e) => { e.stopPropagation(); cb.beginCreateGroup(folder.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-opacity" title="新建词组"><Plus size={12} /></button>
        {/* 右键菜单 */}
        <div ref={menuRef}>
          {menuOpen && (
            <div className="fixed bg-[#fffefc] border border-[#e8e2e3] rounded-[10px] shadow-[0_12px_32px_rgba(48,32,39,.14)] py-1 z-[100] min-w-[120px]" style={{ left: menuPos.x, top: menuPos.y }}>
              <button onClick={() => { setMenuOpen(false); cb.beginCreateGroup(folder.id); }} className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Plus size={12} />新建词组</button>
              {cb.getFolderLevel(folder.id) === 0 && (
                <button onClick={() => { setMenuOpen(false); cb.beginCreateFolder(folder.id); }} className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Plus size={12} />新建子目录</button>
              )}
              <button onClick={() => { setMenuOpen(false); cb.beginRenameFolder(folder); }} className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Pencil size={12} />重命名</button>
              <div className="border-t border-gray-100 my-0.5" />
              <button onClick={() => { setMenuOpen(false); cb.handleDeleteFolder(folder.id); }} className="w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} />删除目录</button>
            </div>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="space-y-0.5">
          {childFolders.map((child) => <div key={child.id} className="ml-4"><FolderBlock folder={child} cb={cb} /></div>)}
          {folderGroups.map((group) => <div key={group.id} className="ml-4">{cb.renderGroupItem(group)}</div>)}
        </div>
      )}
    </div>
  );
};

/* ============================================================
   Sidebar
   ============================================================ */
const WorkspaceItem: React.FC<{
  ws: { id: string; name: string };
  isActive: boolean;
  onNavigate: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onMove: () => void;
}> = ({ ws, isActive, onNavigate, onRename, onDelete, onMove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ws.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [editing, setEditing] = useState(false);
  const [editingName, setEditingName] = useState('');
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  };

  const startRename = () => { setEditingName(ws.name); setEditing(true); setMenuOpen(false); };
  const confirmRename = () => { if (editingName.trim()) onRename(editingName.trim()); setEditing(false); };
  const cancelRename = () => { setEditing(false); };

  if (editing) {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-2 px-3 py-1.5">
        <LayoutDashboard size={14} className="text-gray-400 flex-shrink-0" />
        <input
          type="text" value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') cancelRename(); }}
          className="flex-1 min-w-0 px-2 py-1 border border-accent rounded-md text-[13px] bg-white outline-none"
          autoFocus
        />
        <button onClick={confirmRename} className="p-0.5 rounded text-green-500 hover:bg-green-50" aria-label="确认重命名" title="确认重命名"><Check size={14} /></button>
        <button onClick={cancelRename} className="p-0.5 rounded text-gray-400 hover:bg-gray-100" aria-label="取消重命名" title="取消重命名"><X size={14} /></button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef} style={style}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] leading-5 transition-colors cursor-pointer sidebar-link ${isActive ? 'nav-active sidebar-link-active font-semibold' : ''}`}
      onClick={onNavigate}
      onContextMenu={handleContextMenu}
    >
      <button
        {...attributes} {...listeners}
        className="opacity-0 group-hover:opacity-100 cursor-grab text-gray-300 hover:text-gray-500 flex-shrink-0 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        aria-label={`拖拽工作空间 ${ws.name}`}
        title="拖拽排序"
      ><GripVertical size={12} /></button>
      <span className="truncate flex-1">{ws.name}</span>
      <div ref={menuRef}>
        {menuOpen && (
          <div className="fixed bg-[#fffefc] border border-[#e8e2e3] rounded-[10px] shadow-[0_12px_32px_rgba(48,32,39,.14)] py-1 z-[100] min-w-[120px]" style={{ left: menuPos.x, top: menuPos.y }}>
            <button onClick={(e) => { e.stopPropagation(); startRename(); }} className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Pencil size={12} />重命名</button>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onMove(); }} className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"><ChevronRight size={12} />移动到目录</button>
            <div className="border-t border-gray-100 my-0.5" />
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }} className="w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} />删除</button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================
   WorkspaceFolderBlock — 工作空间目录
   ============================================================ */
interface WsFolderCB {
  toggleFolder: (id: string) => void;
  isFolderOpen: (id: string) => boolean;
  editingFolderId: string | null;
  editingFolderName: string;
  setEditingFolderName: (v: string) => void;
  handleUpdateFolder: () => void;
  setEditingFolderId: (v: string | null) => void;
  beginRename: (f: Folder) => void;
  beginCreateWs: (folderId?: string | null) => void;
  beginCreateFolder: (parentId?: string | null) => void;
  handleDeleteFolder: (id: string) => void;
  getChildFolders: (id: string) => Folder[];
  getWsInFolder: (id: string) => Workspace[];
  renderWsItem: (ws: Workspace) => React.ReactNode;
}

const WorkspaceFolderBlock: React.FC<{ folder: Folder; cb: WsFolderCB }> = ({ folder, cb }) => {
  const droppableId = `wsf-${folder.id}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: droppableId, data: { type: 'ws-folder', folderId: folder.id } });
  const childFolders = cb.getChildFolders(folder.id);
  const wsItems = cb.getWsInFolder(folder.id);
  const isOpen = cb.isFolderOpen(folder.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  };

  return (
    <div ref={setDropRef} className={`rounded-lg transition-colors ${isOver ? 'bg-accent/10 ring-1 ring-accent/30' : ''}`}>
      <div className="group flex items-center gap-1.5 px-2 py-1.5 rounded-[10px] text-[13px] font-semibold text-gray-600 bg-[#f7f3f1] hover:bg-[#f2ece9]" onContextMenu={handleContextMenu}>
        <button onClick={() => cb.toggleFolder(folder.id)} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white" aria-label={isOpen ? '折叠' : '展开'} title={isOpen ? '折叠' : '展开'}>
          <ChevronRight size={12} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        <FolderOpen size={13} className="text-gray-400" />
        {cb.editingFolderId === folder.id ? (
          <input
            type="text" value={cb.editingFolderName}
            onChange={(e) => cb.setEditingFolderName(e.target.value)}
            onBlur={cb.handleUpdateFolder}
            onKeyDown={(e) => { if (e.key === 'Enter') cb.handleUpdateFolder(); if (e.key === 'Escape') { cb.setEditingFolderId(null); cb.setEditingFolderName(''); } }}
            className="flex-1 min-w-0 px-2 py-1 border border-accent rounded-md text-[13px] bg-white outline-none"
            autoFocus
          />
        ) : (
          <span className="flex-1 min-w-0 truncate cursor-pointer" onClick={() => cb.toggleFolder(folder.id)}>{folder.name}</span>
        )}
        <div ref={menuRef}>
          {menuOpen && (
            <div className="fixed bg-[#fffefc] border border-[#e8e2e3] rounded-[10px] shadow-[0_12px_32px_rgba(48,32,39,.14)] py-1 z-[100] min-w-[120px]" style={{ left: menuPos.x, top: menuPos.y }}>
              <button onClick={() => { setMenuOpen(false); cb.beginCreateWs(folder.id); }} className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Plus size={12} />新工作空间</button>
              <button onClick={() => { setMenuOpen(false); cb.beginCreateFolder(folder.id); }} className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Plus size={12} />新建子目录</button>
              <button onClick={() => { setMenuOpen(false); cb.beginRename(folder); }} className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Pencil size={12} />重命名</button>
              <div className="border-t border-gray-100 my-0.5" />
              <button onClick={() => { setMenuOpen(false); cb.handleDeleteFolder(folder.id); }} className="w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} />删除</button>
            </div>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="space-y-0.5">
          {childFolders.map((child) => <div key={child.id} className="ml-4"><WorkspaceFolderBlock folder={child} cb={cb} /></div>)}
          {wsItems.map((ws) => <div key={ws.id} className="ml-4">{cb.renderWsItem(ws)}</div>)}
        </div>
      )}
    </div>
  );
};

const RootDropZone: React.FC = () => {
  const { setNodeRef, isOver } = useDroppable({ id: 'root-drop-zone', data: { type: 'root' } });
  return (
    <div
      ref={setNodeRef}
      className={`h-7 mt-1 rounded-lg border border-dashed transition-colors flex items-center justify-center text-[11px] ${isOver ? 'border-accent bg-accent/10 text-accent' : 'border-transparent text-gray-300'}`}
    >
      {isOver ? '松开移回根目录' : '拖到此处移回根目录'}
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    workspaces, groups, folders, groupFolderMap, groupTags,
    sidebarCollapsed, toggleSidebar, addGroup, addFolder,
    updateFolder, updateGroup, deleteFolder, deleteGroup,
    updateWorkspace, deleteWorkspace, addWorkspace,
    moveGroupToFolder, reorderGroups,
    workspaceFolders, workspaceFolderMap,
    addWorkspaceFolder, updateWorkspaceFolder, deleteWorkspaceFolder,
    moveWorkspaceToFolder, reorderWorkspaces,
  } = useStore();

  // ---- state ----
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
  const [openSections, setOpenSections] = useState({ workspaces: true, groups: true });
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [openWsFolders, setOpenWsFolders] = useState<Record<string, boolean>>({});
  const [showCreateWsModal, setShowCreateWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [showCreateWsFolderModal, setShowCreateWsFolderModal] = useState(false);
  const [newWsFolderName, setNewWsFolderName] = useState('');
  const [editingWsFolderId, setEditingWsFolderId] = useState<string | null>(null);
  const [editingWsFolderName, setEditingWsFolderName] = useState('');
  const [movingWsId, setMovingWsId] = useState<string | null>(null);
  const [moveWsTargetFolderId, setMoveWsTargetFolderId] = useState('');
  const [selectedWsFolderId, setSelectedWsFolderId] = useState<string | null>(null);

  // ---- derived ----
  const getGroupTagCount = (groupId: string) => groupTags[groupId]?.length || 0;
  const rootFolders = folders.filter((f) => !f.parentId);
  const rootGroups = groups.filter((g) => !groupFolderMap[g.id]);
  const getChildFolders = (id: string) => folders.filter((f) => f.parentId === id);
  const getGroupsInFolder = (id: string) => groups.filter((g) => groupFolderMap[g.id] === id);
  const getFolderLevel = (id: string | null): number => {
    if (!id) return -1;
    const f = folders.find((x) => x.id === id);
    return f?.parentId ? 1 : 0;
  };
  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (id: string) => location.pathname === `/group/${id}`;
  const allGroupIds = groups.map((g) => g.id);

  // ---- workspace folder helpers ----
  const wsRootFolders = workspaceFolders.filter((f) => !f.parentId);
  const getWsChildFolders = (id: string) => workspaceFolders.filter((f) => f.parentId === id);
  const getWsInFolder = (id: string) => workspaces.filter((w) => workspaceFolderMap[w.id] === id);
  const wsRootItems = workspaces.filter((w) => !workspaceFolderMap[w.id]);

  // ---- sensors ----
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeGroupId = active.id as string;

    // 拖到目录上 → 移入该目录
    if (over.data?.current?.type === 'folder') {
      const targetFolderId = over.data.current.folderId as string;
      moveGroupToFolder(activeGroupId, targetFolderId);
      return;
    }

    // 拖到根目录区域 → 移出目录
    if (over.data?.current?.type === 'root') {
      moveGroupToFolder(activeGroupId, undefined);
      return;
    }

    // 拖到词组上 → 同级排序
    const oldIdx = allGroupIds.indexOf(activeGroupId);
    const newIdx = allGroupIds.indexOf(over.id as string);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = [...allGroupIds];
    reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, activeGroupId);
    reorderGroups(reordered);
  }, [allGroupIds, reorderGroups, moveGroupToFolder]);

  const allWsIds = workspaces.map((w) => w.id);
  const handleWsDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeWsId = active.id as string;

    if (over.data?.current?.type === 'ws-folder') {
      const targetFolderId = over.data.current.folderId as string;
      moveWorkspaceToFolder(activeWsId, targetFolderId);
      return;
    }

    const oldIdx = allWsIds.indexOf(activeWsId);
    const newIdx = allWsIds.indexOf(over.id as string);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = [...allWsIds];
    reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, activeWsId);
    reorderWorkspaces(reordered);
  }, [allWsIds, reorderWorkspaces, moveWorkspaceToFolder]);

  const handleMoveWsToFolder = () => {
    if (!movingWsId) return;
    moveWorkspaceToFolder(movingWsId, moveWsTargetFolderId || undefined);
    setMovingWsId(null); setMoveWsTargetFolderId('');
  };

  // ---- actions ----
  const beginCreateGroup = (folderId?: string | null) => { setSelectedFolderId(folderId ?? null); setShowCreateGroupModal(true); };
  const beginCreateFolder = (parentId?: string | null) => {
    if (parentId && getFolderLevel(parentId) >= 1) return;
    setSelectedFolderId(parentId ?? null); setShowCreateFolderModal(true);
  };
  const beginRenameFolder = (f: Folder) => { setEditingFolderId(f.id); setEditingFolderName(f.name); };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const g = addGroup({ name: newGroupName.trim(), desc: '' }, selectedFolderId || undefined);
    setShowCreateGroupModal(false); setNewGroupName(''); setSelectedFolderId(null);
    navigate(`/group/${g.id}`);
  };
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder(newFolderName.trim(), selectedFolderId || undefined);
    setShowCreateFolderModal(false); setNewFolderName(''); setSelectedFolderId(null);
  };
  const handleUpdateFolder = () => {
    if (!editingFolderName.trim() || !editingFolderId) return;
    updateFolder(editingFolderId, editingFolderName.trim());
    setEditingFolderId(null); setEditingFolderName('');
  };
  const handleUpdateGroup = () => {
    if (!editingGroupName.trim() || !editingGroupId) return;
    updateGroup(editingGroupId, { name: editingGroupName.trim() });
    setEditingGroupId(null); setEditingGroupName('');
  };
  const handleDeleteGroup = (groupId: string) => {
    const g = groups.find((x) => x.id === groupId);
    if (g && confirm(`确定删除词组「${g.name}」吗？`)) deleteGroup(groupId);
  };
  const handleDeleteFolder = (folderId: string) => {
    const f = folders.find((x) => x.id === folderId);
    if (!f) return;
    const msg = f.parentId
      ? `确定删除目录「${f.name}」吗？该目录下的词组将移到上级目录。`
      : `确定删除目录「${f.name}」吗？子目录会一并移除，目录内词组将移到根目录。`;
    if (confirm(msg)) deleteFolder(folderId);
  };
  const handleMoveGroupToFolder = () => {
    if (!movingGroupId) return;
    moveGroupToFolder(movingGroupId, moveTargetFolderId || undefined);
    setMovingGroupId(null); setMoveTargetFolderId('');
  };

  const handleCreateWorkspace = () => {
    if (!newWsName.trim()) return;
    const ws = addWorkspace({ name: newWsName.trim(), desc: newWsDesc.trim(), color: '255' });
    if (selectedWsFolderId) moveWorkspaceToFolder(ws.id, selectedWsFolderId);
    setShowCreateWsModal(false); setNewWsName(''); setNewWsDesc(''); setSelectedWsFolderId(null);
    navigate(`/workspace/${ws.id}`);
  };

  const handleCreateWsFolder = () => {
    if (!newWsFolderName.trim()) return;
    addWorkspaceFolder(newWsFolderName.trim(), selectedWsFolderId || undefined);
    setShowCreateWsFolderModal(false); setNewWsFolderName(''); setSelectedWsFolderId(null);
  };
  const handleUpdateWsFolder = () => {
    if (!editingWsFolderName.trim() || !editingWsFolderId) return;
    updateWorkspaceFolder(editingWsFolderId, editingWsFolderName.trim());
    setEditingWsFolderId(null); setEditingWsFolderName('');
  };
  const beginRenameWsFolder = (f: Folder) => {
    setEditingWsFolderId(f.id); setEditingWsFolderName(f.name);
  };
  const handleDeleteWsFolder = (id: string) => {
    const f = workspaceFolders.find((x) => x.id === id);
    if (f && confirm(`确定删除目录「${f.name}」吗？`)) deleteWorkspaceFolder(id);
  };

  const toggleSection = (s: 'workspaces' | 'groups') => setOpenSections((c) => ({ ...c, [s]: !c[s] }));
  const toggleFolder = (id: string) => setOpenFolders((c) => ({ ...c, [id]: c[id] !== true }));
  const isFolderOpen = (id: string) => openFolders[id] === true;
  const toggleWsFolder = (id: string) => setOpenWsFolders((c) => ({ ...c, [id]: c[id] !== true }));
  const isWsFolderOpen = (id: string) => openWsFolders[id] === true;

  // 自动展开当前选中项所在的目录
  useEffect(() => {
    // 词组：从 URL 提取 groupId，展开其所在目录
    const groupMatch = location.pathname.match(/^\/group\/(.+)$/);
    if (groupMatch) {
      const groupId = groupMatch[1];
      const folderId = groupFolderMap[groupId];
      if (folderId) {
        setOpenFolders((c) => ({ ...c, [folderId]: true }));
      }
    }

    // 工作空间：从 URL 提取 workspaceId，展开其所在目录
    const wsMatch = location.pathname.match(/^\/workspace\/(.+)$/);
    if (wsMatch) {
      const wsId = wsMatch[1];
      const wsFolderId = workspaceFolderMap[wsId];
      if (wsFolderId) {
        setOpenWsFolders((c) => ({ ...c, [wsFolderId]: true }));
      }
    }
  }, [location.pathname, groupFolderMap, workspaceFolderMap]);

  // ---- render helpers ----
  const renderGroupItem = (group: Group) => (
    <SortableGroupItem
      key={group.id}
      group={group}
      tagCount={getGroupTagCount(group.id)}
      isActive={isGroupActive(group.id)}
      isEditing={editingGroupId === group.id}
      editingName={editingGroupName}
      onStartEdit={() => { setEditingGroupId(group.id); setEditingGroupName(group.name); }}
      onEditingNameChange={setEditingGroupName}
      onConfirmEdit={handleUpdateGroup}
      onCancelEdit={() => { setEditingGroupId(null); setEditingGroupName(''); }}
      onNavigate={() => navigate(`/group/${group.id}`)}
      onMove={() => { setMovingGroupId(group.id); setMoveTargetFolderId(groupFolderMap[group.id] || ''); }}
      onDelete={() => handleDeleteGroup(group.id)}
    />
  );

  const folderCB: FolderBlockCallbacks = {
    toggleFolder, isFolderOpen, editingFolderId, editingFolderName,
    setEditingFolderName, handleUpdateFolder, setEditingFolderId,
    beginRenameFolder, beginCreateGroup, beginCreateFolder,
    handleDeleteFolder, getFolderLevel, getChildFolders, getGroupsInFolder,
    renderGroupItem,
  };

  const renderWsItem = (ws: (typeof workspaces)[0]) => (
    <WorkspaceItem
      key={ws.id}
      ws={ws}
      isActive={isActive(`/workspace/${ws.id}`)}
      onNavigate={() => navigate(`/workspace/${ws.id}`)}
      onRename={(name) => updateWorkspace(ws.id, { name })}
      onDelete={() => {
        if (confirm(`确定删除工作空间「${ws.name}」吗？`)) deleteWorkspace(ws.id);
      }}
      onMove={() => { setMovingWsId(ws.id); setMoveWsTargetFolderId(workspaceFolderMap[ws.id] || ''); }}
    />
  );

  const wsFolderCB: WsFolderCB = {
    toggleFolder: toggleWsFolder,
    isFolderOpen: isWsFolderOpen,
    editingFolderId: editingWsFolderId,
    editingFolderName: editingWsFolderName,
    setEditingFolderName: setEditingWsFolderName,
    handleUpdateFolder: handleUpdateWsFolder,
    setEditingFolderId: setEditingWsFolderId,
    beginRename: beginRenameWsFolder,
    beginCreateWs: (folderId) => { setSelectedWsFolderId(folderId ?? null); setShowCreateWsModal(true); },
    beginCreateFolder: (parentId) => { setSelectedWsFolderId(parentId ?? null); setShowCreateWsFolderModal(true); },
    handleDeleteFolder: handleDeleteWsFolder,
    getChildFolders: getWsChildFolders,
    getWsInFolder,
    renderWsItem,
  };

  // ---- collapsed ----
  if (sidebarCollapsed) {
    return (
      <aside className="w-16 flex-shrink-0 sidebar-collapsed-warm flex flex-col h-screen sticky top-0 z-40">
        <div className="h-14 flex items-center justify-center border-b sidebar-divider">
          <button onClick={toggleSidebar} className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-semibold shadow-sm" title="展开侧边栏">G</button>
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

  // ---- expanded ----
  return (
    <>
      <aside className="w-full flex-shrink-0 sidebar-warm flex flex-col h-screen sticky top-0 z-40">
        {/* header */}
        <div className="flex items-center justify-between px-4 h-14 border-b sidebar-divider">
          <Link to="/" className="flex items-center gap-2.5 text-gray-900 font-semibold">
            <span className="w-1 h-5 rounded-full bg-accent" />
            <span className="text-[15px] tracking-tight">Grain Tag</span>
          </Link>
          <button onClick={toggleSidebar} className="w-8 h-8 flex items-center justify-center rounded-lg sidebar-footer-btn transition-colors" title="收起侧边栏" aria-label="收起侧边栏"><ChevronLeft size={14} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {/* 工作空间 */}
          <section className="pb-3 mb-3 border-b sidebar-divider">
            <button onClick={() => toggleSection('workspaces')} className="w-full flex items-center justify-between px-2 py-1.5 text-[12px] font-semibold sidebar-section-title hover:text-gray-800 rounded-lg transition-colors">
              <span className="flex items-center gap-2"><LayoutDashboard size={14} className="nav-icon sidebar-section-icon" />工作空间</span>
              <ChevronRight size={14} className={`text-gray-400 transition-transform ${openSections.workspaces ? 'rotate-90' : ''}`} />
            </button>
            {openSections.workspaces && (workspaces.length > 0 || wsRootFolders.length > 0
              ? (
                <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragEnd={handleWsDragEnd}>
                  <SortableContext items={allWsIds} strategy={verticalListSortingStrategy}>
                    {wsRootFolders.map((f) => <WorkspaceFolderBlock key={f.id} folder={f} cb={wsFolderCB} />)}
                    {wsRootItems.map((ws) => renderWsItem(ws))}
                    <div
                      className="h-7 mt-1 rounded-lg border border-dashed transition-colors flex items-center justify-center text-[11px] border-transparent text-gray-300"
                    >拖到此处移回根目录</div>
                  </SortableContext>
                </DndContext>
              )
              : <p className="px-3 py-2 text-[13px] text-gray-400">暂无工作空间</p>
            )}
            {openSections.workspaces && (
              <div className="flex gap-1 mt-1">
                <button onClick={() => { setSelectedWsFolderId(null); setShowCreateWsModal(true); }} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"><Plus size={12} />工作空间</button>
                <button onClick={() => { setSelectedWsFolderId(null); setShowCreateWsFolderModal(true); }} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"><Plus size={12} />目录</button>
              </div>
            )}
          </section>

          {/* 词组 - dnd-kit 拖拽排序 */}
          <section className="pb-3 mb-3 border-b sidebar-divider">
            <button onClick={() => toggleSection('groups')} className="w-full flex items-center justify-between px-2 py-1.5 text-[12px] font-semibold sidebar-section-title hover:text-gray-800 rounded-lg transition-colors">
              <span className="flex items-center gap-2"><FolderOpen size={14} className="nav-icon sidebar-section-icon" />词组</span>
              <ChevronRight size={14} className={`text-gray-400 transition-transform ${openSections.groups ? 'rotate-90' : ''}`} />
            </button>
            {openSections.groups && (
              <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragEnd={handleDragEnd}>
                <SortableContext items={allGroupIds} strategy={verticalListSortingStrategy}>
                  <div className="max-h-[360px] space-y-0.5 overflow-y-auto overscroll-contain pr-1">
                    {rootFolders.map((f) => <FolderBlock key={f.id} folder={f} cb={folderCB} />)}
                    {rootGroups.map((g) => renderGroupItem(g))}
                    {/* 拖拽移回根目录区域 */}
                    <RootDropZone />
                    <div className="flex gap-1 px-2 pt-1">
                      <button onClick={() => beginCreateGroup(null)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"><Plus size={12} />词组</button>
                      <button onClick={() => beginCreateFolder(null)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"><Plus size={12} />目录</button>
                    </div>
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </section>

          {/* 提示词管理 */}
          <section>
            <Link to="/tags" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] leading-5 transition-colors sidebar-link ${isActive('/tags') || location.pathname.startsWith('/tag') ? 'nav-active sidebar-link-active font-semibold' : ''}`}>
              <Tag size={14} className="nav-icon" /><span className="truncate">提示词管理</span><span className="sidebar-dot" />
            </Link>
          </section>
        </nav>

        <div className="p-3 border-t sidebar-footer flex gap-2">
          <Link to="/" className="w-9 h-9 flex items-center justify-center rounded-lg sidebar-footer-btn transition-colors" title="首页"><Home size={16} /></Link>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg sidebar-footer-btn transition-colors" title="设置" aria-label="设置" onClick={() => setShowSettingsModal(true)}><Settings size={16} /></button>
        </div>
      </aside>

      {/* ---- Modals ---- */}
      <Modal isOpen={Boolean(movingGroupId)} onClose={() => { setMovingGroupId(null); setMoveTargetFolderId(''); }} title="移动词组" description={`将词组「${groups.find((g) => g.id === movingGroupId)?.name || ''}」移动到指定目录`}>
        <div className="space-y-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">目标目录</label>
          <select value={moveTargetFolderId} onChange={(e) => setMoveTargetFolderId(e.target.value)} className="form-control w-full h-10 px-3 text-sm">
            <option value="">（根目录）</option>
            {rootFolders.map((f) => (
              <React.Fragment key={f.id}>
                <option value={f.id}>{f.name}</option>
                {getChildFolders(f.id).map((c) => <option key={c.id} value={c.id}>└ {c.name}</option>)}
              </React.Fragment>
            ))}
          </select>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => { setMovingGroupId(null); setMoveTargetFolderId(''); }}>取消</Button>
            <Button onClick={handleMoveGroupToFolder}>移动</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(movingWsId)} onClose={() => { setMovingWsId(null); setMoveWsTargetFolderId(''); }} title="移动工作空间" description={`将工作空间「${workspaces.find((w) => w.id === movingWsId)?.name || ''}」移动到指定目录`}>
        <div className="space-y-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">目标目录</label>
          <select value={moveWsTargetFolderId} onChange={(e) => setMoveWsTargetFolderId(e.target.value)} className="form-control w-full h-10 px-3 text-sm">
            <option value="">（根目录）</option>
            {wsRootFolders.map((f) => (
              <React.Fragment key={f.id}>
                <option value={f.id}>{f.name}</option>
                {getWsChildFolders(f.id).map((c) => <option key={c.id} value={c.id}>└ {c.name}</option>)}
              </React.Fragment>
            ))}
          </select>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => { setMovingWsId(null); setMoveWsTargetFolderId(''); }}>取消</Button>
            <Button onClick={handleMoveWsToFolder}>移动</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCreateGroupModal} onClose={() => setShowCreateGroupModal(false)} title="新建词组">
        <div className="space-y-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">词组名称</label>
          <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="例如：人物肖像" className="form-control w-full h-10 px-3 text-sm" autoFocus />
          {selectedFolderId && <p className="text-xs text-gray-400">将在目录「{folders.find((f) => f.id === selectedFolderId)?.name}」下创建</p>}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateGroupModal(false)}>取消</Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>创建</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCreateFolderModal} onClose={() => setShowCreateFolderModal(false)} title="新建目录">
        <div className="space-y-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">目录名称</label>
          <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="例如：设计素材" className="form-control w-full h-10 px-3 text-sm" autoFocus />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">父目录（可选）</label>
            <select value={selectedFolderId || ''} onChange={(e) => setSelectedFolderId(e.target.value || null)} className="form-control w-full h-10 px-3 text-sm">
              <option value="">（无父目录 — 创建一级目录）</option>
              {rootFolders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
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

      <Modal isOpen={showCreateWsModal} onClose={() => setShowCreateWsModal(false)} title="新建工作空间">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">名称</label>
            <input type="text" value={newWsName} onChange={(e) => setNewWsName(e.target.value)} placeholder="例如：品牌设计素材" className="form-control w-full h-10 px-3 text-sm" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">描述（可选）</label>
            <input type="text" value={newWsDesc} onChange={(e) => setNewWsDesc(e.target.value)} placeholder="简要描述这个工作空间的用途" className="form-control w-full h-10 px-3 text-sm" />
          </div>
          {selectedWsFolderId && (
            <p className="text-xs text-gray-400">将在目录「{workspaceFolders.find((f) => f.id === selectedWsFolderId)?.name}」下创建</p>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateWsModal(false)}>取消</Button>
            <Button onClick={handleCreateWorkspace} disabled={!newWsName.trim()}>创建</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCreateWsFolderModal} onClose={() => setShowCreateWsFolderModal(false)} title="新建工作空间目录">
        <div className="space-y-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">目录名称</label>
          <input type="text" value={newWsFolderName} onChange={(e) => setNewWsFolderName(e.target.value)} placeholder="例如：设计项目" className="form-control w-full h-10 px-3 text-sm" autoFocus />
          {selectedWsFolderId && (
            <p className="text-xs text-gray-400">将在目录「{workspaceFolders.find((f) => f.id === selectedWsFolderId)?.name}」下创建</p>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateWsFolderModal(false)}>取消</Button>
            <Button onClick={handleCreateWsFolder} disabled={!newWsFolderName.trim()}>创建</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
