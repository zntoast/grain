import { create } from 'zustand';
import type { StoreState, Workspace, Group, Tag, Folder, GrainDataSnapshot, CursorMode } from './types';
import {
  DEFAULT_WORKSPACES,
  DEFAULT_GROUPS,
  DEFAULT_TAGS,
  DEFAULT_WORKSPACE_GROUPS,
  DEFAULT_GROUP_TAGS,
  COLOR_OPTIONS,
} from './constants';
import {
  getSavedDataFileHandle,
  readSnapshotFromFile,
  writeSnapshotToFile,
  type GrainFileHandle,
} from './services/localDataFile';

const STORAGE_KEY = 'grain_prompt_manager_data';

// 生成唯一 ID
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 深拷贝
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const mergeById = <T extends { id: string }>(current: T[] | undefined, defaults: T[]): T[] => {
  const currentItems = current?.length ? current : [];
  const currentIds = new Set(currentItems.map((item) => item.id));
  const missingDefaults = defaults.filter((item) => !currentIds.has(item.id));
  return [...currentItems, ...deepClone(missingDefaults)];
};

const normalizeFolders = (folders: Folder[] | undefined): Folder[] => {
  if (!folders?.length) return [];
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  return folders.map((folder) => ({
    ...folder,
    parentId:
      folder.parentId && folderById.has(folder.parentId)
        ? folderById.get(folder.parentId)?.parentId || folder.parentId
        : undefined,
  }));
};

const normalizeSnapshot = (data: Partial<GrainDataSnapshot>): GrainDataSnapshot => ({
  version: 1,
  savedAt: data.savedAt || new Date().toISOString(),
  workspaces: data.workspaces?.length ? data.workspaces : deepClone(DEFAULT_WORKSPACES),
  groups: data.groups?.length ? data.groups : deepClone(DEFAULT_GROUPS),
  tags: mergeById<Tag>(data.tags, DEFAULT_TAGS),
  workspaceGroups:
    data.workspaceGroups && Object.keys(data.workspaceGroups).length > 0
      ? data.workspaceGroups
      : deepClone(DEFAULT_WORKSPACE_GROUPS),
  groupTags:
    data.groupTags && Object.keys(data.groupTags).length > 0
      ? data.groupTags
      : deepClone(DEFAULT_GROUP_TAGS),
  folders: normalizeFolders(data.folders),
  groupFolderMap: data.groupFolderMap || {},
  workspaceFolders: normalizeFolders(data.workspaceFolders),
  workspaceFolderMap: data.workspaceFolderMap || {},
  tagIdCounter: data.tagIdCounter || 100,
  folderIdCounter: data.folderIdCounter || 10,
  workspaceFolderIdCounter: data.workspaceFolderIdCounter || 10,
  sidebarCollapsed: data.sidebarCollapsed || false,
  currentWorkspaceId: data.currentWorkspaceId || DEFAULT_WORKSPACES[0]?.id || null,
  cursorMode: (data.cursorMode as CursorMode) || 'off',
  syncInterval: data.syncInterval || 30,
});

export const useStore = create<StoreState>((set, get) => ({
  // 初始数据
  workspaces: deepClone(DEFAULT_WORKSPACES),
  groups: deepClone(DEFAULT_GROUPS),
  tags: deepClone(DEFAULT_TAGS),
  workspaceGroups: deepClone(DEFAULT_WORKSPACE_GROUPS),
  groupTags: deepClone(DEFAULT_GROUP_TAGS),
  folders: [],
  groupFolderMap: {},
  workspaceFolders: [],
  workspaceFolderMap: {},
  tagIdCounter: 100,
  folderIdCounter: 10,
  workspaceFolderIdCounter: 10,
  sidebarCollapsed: false,
  currentWorkspaceId: DEFAULT_WORKSPACES[0]?.id || null,
  cursorMode: 'off' as CursorMode,
  syncInterval: 30,
  hasCompletedOnboarding: false,

  // 引导流程
  setHasCompletedOnboarding: (completed) => {
    set({ hasCompletedOnboarding: completed });
    localStorage.setItem('grain_onboarding_completed', String(completed));
  },
  addWorkspace: (workspaceData) => {
    const newWorkspace: Workspace = {
      id: `ws_${generateId()}`,
      ...workspaceData,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    set((state) => ({
      workspaces: [...state.workspaces, newWorkspace],
      workspaceGroups: { ...state.workspaceGroups, [newWorkspace.id]: [] },
    }));
    get().saveToStorage();
    return newWorkspace;
  },

  updateWorkspace: (id, data) => {
    set((state) => ({
      workspaces: state.workspaces.map((ws) =>
        ws.id === id ? { ...ws, ...data } : ws
      ),
    }));
    get().saveToStorage();
  },

  deleteWorkspace: (id) => {
    set((state) => {
      const newWorkspaceGroups = { ...state.workspaceGroups };
      delete newWorkspaceGroups[id];
      const newCurrentId =
        state.currentWorkspaceId === id
          ? state.workspaces.find((ws) => ws.id !== id)?.id || null
          : state.currentWorkspaceId;
      return {
        workspaces: state.workspaces.filter((ws) => ws.id !== id),
        workspaceGroups: newWorkspaceGroups,
        currentWorkspaceId: newCurrentId,
      };
    });
    get().saveToStorage();
  },

  setCurrentWorkspace: (id) => {
    set({ currentWorkspaceId: id });
  },

  // 词组操作
  addGroup: (groupData, folderId) => {
    const newGroup: Group = {
      id: groupData.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '_').replace(/^_|_$/g, '') || `group_${generateId()}`,
      ...groupData,
      color: COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)],
    };
    set((state) => ({
      groups: [...state.groups, newGroup],
      groupTags: { ...state.groupTags, [newGroup.id]: [] },
      groupFolderMap: folderId
        ? { ...state.groupFolderMap, [newGroup.id]: folderId }
        : state.groupFolderMap,
    }));
    get().saveToStorage();
    return newGroup;
  },

  updateGroup: (id, data) => {
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? { ...g, ...data } : g)),
    }));
    get().saveToStorage();
  },

  deleteGroup: (id) => {
    set((state) => {
      const newGroupTags = { ...state.groupTags };
      delete newGroupTags[id];
      const newGroupFolderMap = { ...state.groupFolderMap };
      delete newGroupFolderMap[id];
      // 从所有工作空间中移除该词组
      const newWorkspaceGroups = { ...state.workspaceGroups };
      Object.keys(newWorkspaceGroups).forEach((wsId) => {
        newWorkspaceGroups[wsId] = newWorkspaceGroups[wsId].filter(
          (entry) => entry.groupId !== id
        );
      });
      return {
        groups: state.groups.filter((g) => g.id !== id),
        groupTags: newGroupTags,
        groupFolderMap: newGroupFolderMap,
        workspaceGroups: newWorkspaceGroups,
      };
    });
    get().saveToStorage();
  },

  reorderGroups: (orderedIds) => {
    set((state) => {
      const idToGroup = new Map(state.groups.map((g) => [g.id, g]));
      const reordered = orderedIds.map((id) => idToGroup.get(id)!).filter(Boolean);
      // 保留不在 orderedIds 中的 group（安全兜底）
      const rest = state.groups.filter((g) => !orderedIds.includes(g.id));
      return { groups: [...reordered, ...rest] };
    });
    get().saveToStorage();
  },

  // 工作空间目录
  addWorkspaceFolder: (name, parentId) => {
    const state = get();
    const newFolder: Folder = { id: `wsf_${state.workspaceFolderIdCounter}`, name, parentId };
    set((s) => ({
      workspaceFolders: [...s.workspaceFolders, newFolder],
      workspaceFolderIdCounter: s.workspaceFolderIdCounter + 1,
    }));
    get().saveToStorage();
    return newFolder;
  },
  updateWorkspaceFolder: (id, name) => {
    set((s) => ({
      workspaceFolders: s.workspaceFolders.map((f) => (f.id === id ? { ...f, name } : f)),
    }));
    get().saveToStorage();
  },
  deleteWorkspaceFolder: (id) => {
    set((s) => {
      const childFolderIds = new Set(
        s.workspaceFolders.filter((f) => f.parentId === id).map((f) => f.id)
      );
      const newMap = { ...s.workspaceFolderMap };
      Object.keys(newMap).forEach((wsId) => {
        if (newMap[wsId] === id || childFolderIds.has(newMap[wsId])) {
          delete newMap[wsId];
        }
      });
      return {
        workspaceFolders: s.workspaceFolders.filter(
          (f) => f.id !== id && !childFolderIds.has(f.id)
        ),
        workspaceFolderMap: newMap,
      };
    });
    get().saveToStorage();
  },
  moveWorkspaceToFolder: (wsId, folderId) => {
    set((s) => {
      const next = { ...s.workspaceFolderMap };
      if (folderId) next[wsId] = folderId;
      else delete next[wsId];
      return { workspaceFolderMap: next };
    });
    get().saveToStorage();
  },
  reorderWorkspaces: (orderedIds) => {
    set((s) => {
      const idToWs = new Map(s.workspaces.map((w) => [w.id, w]));
      const reordered = orderedIds.map((id) => idToWs.get(id)!).filter(Boolean);
      const rest = s.workspaces.filter((w) => !orderedIds.includes(w.id));
      return { workspaces: [...reordered, ...rest] };
    });
    get().saveToStorage();
  },

  // Tag 操作
  addTag: (tagData) => {
    const state = get();
    const newTag: Tag = {
      id: `${tagData.en.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${state.tagIdCounter}`,
      ...tagData,
    };
    set((state) => ({
      tags: [...state.tags, newTag],
      tagIdCounter: state.tagIdCounter + 1,
    }));
    get().saveToStorage();
    return newTag;
  },

  updateTag: (id, data) => {
    set((state) => ({
      tags: state.tags.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));
    get().saveToStorage();
  },

  deleteTag: (id) => {
    set((state) => {
      // 从所有词组中移除该 Tag
      const newGroupTags = { ...state.groupTags };
      Object.keys(newGroupTags).forEach((groupId) => {
        newGroupTags[groupId] = newGroupTags[groupId].filter((tagId) => tagId !== id);
      });
      return {
        tags: state.tags.filter((t) => t.id !== id),
        groupTags: newGroupTags,
      };
    });
    get().saveToStorage();
  },

  addTags: (tagsData) => {
    const state = get();
    const newTags: Tag[] = tagsData.map((tagData) => ({
      id: `${tagData.en.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${state.tagIdCounter + tagsData.indexOf(tagData)}`,
      ...tagData,
    }));
    set((state) => ({
      tags: [...state.tags, ...newTags],
      tagIdCounter: state.tagIdCounter + tagsData.length,
    }));
    get().saveToStorage();
    return newTags;
  },

  // 工作空间-词组关联
  linkGroupToWorkspace: (workspaceId, groupId, type) => {
    set((state) => {
      const entries = state.workspaceGroups[workspaceId] || [];
      // 检查是否已存在
      if (entries.some((e) => e.groupId === groupId)) {
        return state;
      }
      return {
        workspaceGroups: {
          ...state.workspaceGroups,
          [workspaceId]: [...entries, { groupId, type }],
        },
      };
    });
    get().saveToStorage();
  },

  unlinkGroupFromWorkspace: (workspaceId, groupId) => {
    set((state) => ({
      workspaceGroups: {
        ...state.workspaceGroups,
        [workspaceId]: (state.workspaceGroups[workspaceId] || []).filter(
          (e) => e.groupId !== groupId
        ),
      },
    }));
    get().saveToStorage();
  },

  setGroupType: (workspaceId, groupId, type) => {
    set((state) => ({
      workspaceGroups: {
        ...state.workspaceGroups,
        [workspaceId]: (state.workspaceGroups[workspaceId] || []).map((e) =>
          e.groupId === groupId ? { ...e, type } : e
        ),
      },
    }));
    get().saveToStorage();
  },

  updateWorkspaceGroupOrder: (workspaceId, draggedGroupId, targetIndex) => {
    set((state) => {
      const entries = [...(state.workspaceGroups[workspaceId] || [])];
      const draggedIndex = entries.findIndex((e) => e.groupId === draggedGroupId);
      if (draggedIndex === -1) return state;
      
      const [removed] = entries.splice(draggedIndex, 1);
      entries.splice(targetIndex, 0, removed);
      
      return {
        workspaceGroups: {
          ...state.workspaceGroups,
          [workspaceId]: entries,
        },
      };
    });
    get().saveToStorage();
  },

  // 词组-Tag 关联
  linkTagToGroup: (groupId, tagId) => {
    set((state) => {
      const tagIds = state.groupTags[groupId] || [];
      if (tagIds.includes(tagId)) return state;
      return {
        groupTags: {
          ...state.groupTags,
          [groupId]: [...tagIds, tagId],
        },
      };
    });
    get().saveToStorage();
  },

  unlinkTagFromGroup: (groupId, tagId) => {
    set((state) => ({
      groupTags: {
        ...state.groupTags,
        [groupId]: (state.groupTags[groupId] || []).filter((id) => id !== tagId),
      },
    }));
    get().saveToStorage();
  },

  toggleTagInGroup: (groupId, tagId) => {
    const state = get();
    const tagIds = state.groupTags[groupId] || [];
    if (tagIds.includes(tagId)) {
      get().unlinkTagFromGroup(groupId, tagId);
    } else {
      get().linkTagToGroup(groupId, tagId);
    }
  },

  reorderTagsInGroup: (groupId, tagIds) => {
    set((state) => ({
      groupTags: {
        ...state.groupTags,
        [groupId]: tagIds,
      },
    }));
    get().saveToStorage();
  },

  // 目录操作
  addFolder: (name, parentId) => {
    const state = get();
    const newFolder: Folder = {
      id: `f${state.folderIdCounter}`,
      name,
      parentId,
    };
    set((state) => ({
      folders: [...state.folders, newFolder],
      folderIdCounter: state.folderIdCounter + 1,
    }));
    get().saveToStorage();
    return newFolder;
  },

  updateFolder: (id, name) => {
    set((state) => ({
      folders: state.folders.map((f) => (f.id === id ? { ...f, name } : f)),
    }));
    get().saveToStorage();
  },

  deleteFolder: (id) => {
    set((state) => {
      const folder = state.folders.find((item) => item.id === id);
      if (!folder) return state;

      const childFolderIds = state.folders
        .filter((item) => item.parentId === id)
        .map((item) => item.id);
      const removedFolderIds = new Set([id, ...childFolderIds]);
      const newGroupFolderMap = { ...state.groupFolderMap };
      Object.keys(newGroupFolderMap).forEach((groupId) => {
        const currentFolderId = newGroupFolderMap[groupId];
        if (!removedFolderIds.has(currentFolderId)) return;
        if (folder.parentId) {
          newGroupFolderMap[groupId] = folder.parentId;
        } else {
          delete newGroupFolderMap[groupId];
        }
      });
      return {
        folders: state.folders.filter((f) => !removedFolderIds.has(f.id)),
        groupFolderMap: newGroupFolderMap,
      };
    });
    get().saveToStorage();
  },

  moveGroupToFolder: (groupId, folderId) => {
    set((state) => {
      const nextMap = { ...state.groupFolderMap };
      if (folderId) {
        nextMap[groupId] = folderId;
      } else {
        delete nextMap[groupId];
      }
      return { groupFolderMap: nextMap };
    });
    get().saveToStorage();
  },

  // UI 操作
  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setCursorMode: (mode) => {
    set({ cursorMode: mode });
    get().saveToStorage();
  },

  setSyncInterval: (seconds) => {
    set({ syncInterval: Math.max(1, seconds) });
    get().saveToStorage();
  },

  // 数据持久化
  loadFromStorage: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = normalizeSnapshot(JSON.parse(saved));
        set(data);
      }
    } catch (e) {
      console.error('Failed to load from storage:', e);
    }
  },

  saveToStorage: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().exportData()));
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  },

  exportData: () => {
    const state = get();
    // 读取自定义分类
    let customCategories: string[] = [];
    try {
      const saved = localStorage.getItem('grain_custom_categories');
      if (saved) customCategories = JSON.parse(saved);
    } catch {
      customCategories = [];
    }
    
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      workspaces: state.workspaces,
      groups: state.groups,
      tags: state.tags,
      workspaceGroups: state.workspaceGroups,
      groupTags: state.groupTags,
      folders: state.folders,
      groupFolderMap: state.groupFolderMap,
      workspaceFolders: state.workspaceFolders,
      workspaceFolderMap: state.workspaceFolderMap,
      tagIdCounter: state.tagIdCounter,
      folderIdCounter: state.folderIdCounter,
      workspaceFolderIdCounter: state.workspaceFolderIdCounter,
      sidebarCollapsed: state.sidebarCollapsed,
      currentWorkspaceId: state.currentWorkspaceId,
      cursorMode: state.cursorMode,
      syncInterval: state.syncInterval,
      customCategories,
    };
  },

  importData: (data) => {
    const normalized = normalizeSnapshot(data);
    set(normalized);
    // 恢复自定义分类
    if (data.customCategories && Array.isArray(data.customCategories)) {
      localStorage.setItem('grain_custom_categories', JSON.stringify(data.customCategories));
    }
    get().saveToStorage();
  },
}));

// ====== 自动同步模块 ======
let syncTimer: ReturnType<typeof setInterval> | null = null;

// 启动自动同步
const startAutoSync = (handle: GrainFileHandle) => {
  if (syncTimer) clearInterval(syncTimer);
  const tick = () => {
    syncTimer = setTimeout(async () => {
      console.log('[Sync] 定时同步开始...');
      try {
        await writeSnapshotToFile(handle, useStore.getState().exportData());
        console.log('[Sync] 定时同步成功, 触发 toast event');
        window.dispatchEvent(new CustomEvent('grain-sync-result', { detail: { ok: true } }));
      } catch (e) {
        console.error('[Sync] 定时同步失败:', e);
        window.dispatchEvent(new CustomEvent('grain-sync-result', { detail: { ok: false } }));
      }
      tick();
    }, useStore.getState().syncInterval * 1000);
  };
  tick();
};

// 绑定数据文件（用户选择/创建文件时调用）
export const bindDataFile = async (handle: GrainFileHandle) => {
  console.log('[Sync] bindDataFile 开始, 文件:', handle.name);
  // 先从文件读取最新数据
  try {
    const data = await readSnapshotFromFile(handle);
    useStore.getState().importData(data);
    console.log('[Sync] 从文件读取数据成功');
  } catch {
    console.log('[Sync] 文件为空或不可读，写入当前数据');
    try {
      await writeSnapshotToFile(handle, useStore.getState().exportData());
      console.log('[Sync] 初始写入成功');
      window.dispatchEvent(new CustomEvent('grain-sync-result', { detail: { ok: true } }));
    } catch (e) {
      console.error('[Sync] 初始写入失败:', e);
      window.dispatchEvent(new CustomEvent('grain-sync-result', { detail: { ok: false } }));
    }
  }
  startAutoSync(handle);
  console.log('[Sync] 自动同步已启动, 间隔:', useStore.getState().syncInterval, '秒');
  // 立即执行一次同步
  try {
    await writeSnapshotToFile(handle, useStore.getState().exportData());
    console.log('[Sync] 首次立即同步成功, 触发 toast event');
    window.dispatchEvent(new CustomEvent('grain-sync-result', { detail: { ok: true } }));
  } catch (e) {
    console.error('[Sync] 首次同步失败:', e);
    window.dispatchEvent(new CustomEvent('grain-sync-result', { detail: { ok: false } }));
  }
};

// 解绑数据文件
export const unbindDataFile = () => {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
};

// 初始化
if (typeof window !== 'undefined') {
  const store = useStore.getState();

  // 1. 先从 localStorage 快速加载
  store.loadFromStorage();

  // 2. 检查是否有绑定的本地文件（不自动同步，仅记录状态）
  getSavedDataFileHandle().then((handle) => {
    if (!handle) return;
    // 文件存在，但用户需手动在设置中开启同步
    // 如需要恢复数据，用户可在设置中开启同步后自动从文件读取
  });
}
