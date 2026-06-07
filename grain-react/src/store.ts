import { create } from 'zustand';
import type { StoreState, Workspace, Group, Tag, Folder } from './types';
import {
  DEFAULT_WORKSPACES,
  DEFAULT_GROUPS,
  DEFAULT_TAGS,
  DEFAULT_WORKSPACE_GROUPS,
  DEFAULT_GROUP_TAGS,
  COLOR_OPTIONS,
} from './constants';

const STORAGE_KEY = 'grain_prompt_manager_data';

// 生成唯一 ID
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 深拷贝
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const useStore = create<StoreState>((set, get) => ({
  // 初始数据
  workspaces: deepClone(DEFAULT_WORKSPACES),
  groups: deepClone(DEFAULT_GROUPS),
  tags: deepClone(DEFAULT_TAGS),
  workspaceGroups: deepClone(DEFAULT_WORKSPACE_GROUPS),
  groupTags: deepClone(DEFAULT_GROUP_TAGS),
  folders: [],
  groupFolderMap: {},
  tagIdCounter: 100,
  folderIdCounter: 10,
  sidebarCollapsed: false,
  currentWorkspaceId: DEFAULT_WORKSPACES[0]?.id || null,

  // 工作空间操作
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
  addFolder: (name) => {
    const state = get();
    const newFolder: Folder = {
      id: `f${state.folderIdCounter}`,
      name,
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
      // 将该目录下的词组移到根目录
      const newGroupFolderMap = { ...state.groupFolderMap };
      Object.keys(newGroupFolderMap).forEach((groupId) => {
        if (newGroupFolderMap[groupId] === id) {
          delete newGroupFolderMap[groupId];
        }
      });
      return {
        folders: state.folders.filter((f) => f.id !== id),
        groupFolderMap: newGroupFolderMap,
      };
    });
    get().saveToStorage();
  },

  // UI 操作
  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  // 数据持久化
  loadFromStorage: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        set({
          workspaces: data.workspaces?.length > 0 ? data.workspaces : deepClone(DEFAULT_WORKSPACES),
          groups: data.groups?.length > 0 ? data.groups : deepClone(DEFAULT_GROUPS),
          tags: data.tags?.length > 0 ? data.tags : deepClone(DEFAULT_TAGS),
          workspaceGroups: data.workspaceGroups && Object.keys(data.workspaceGroups).length > 0 ? data.workspaceGroups : deepClone(DEFAULT_WORKSPACE_GROUPS),
          groupTags: data.groupTags && Object.keys(data.groupTags).length > 0 ? data.groupTags : deepClone(DEFAULT_GROUP_TAGS),
          folders: data.folders || [],
          groupFolderMap: data.groupFolderMap || {},
          tagIdCounter: data.tagIdCounter || 100,
          folderIdCounter: data.folderIdCounter || 10,
          sidebarCollapsed: data.sidebarCollapsed || false,
          currentWorkspaceId: data.currentWorkspaceId || DEFAULT_WORKSPACES[0]?.id || null,
        });
      }
    } catch (e) {
      console.error('Failed to load from storage:', e);
    }
  },

  saveToStorage: () => {
    try {
      const state = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          workspaces: state.workspaces,
          groups: state.groups,
          tags: state.tags,
          workspaceGroups: state.workspaceGroups,
          groupTags: state.groupTags,
          folders: state.folders,
          groupFolderMap: state.groupFolderMap,
          tagIdCounter: state.tagIdCounter,
          folderIdCounter: state.folderIdCounter,
          sidebarCollapsed: state.sidebarCollapsed,
          currentWorkspaceId: state.currentWorkspaceId,
        })
      );
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  },
}));

// 初始化时加载数据
if (typeof window !== 'undefined') {
  useStore.getState().loadFromStorage();
}
