// 工作空间
export interface Workspace {
  id: string;
  name: string;
  desc: string;
  color: string; // 色相值
  createdAt: string;
}

// 词组
export interface Group {
  id: string;
  name: string;
  desc: string;
  color: string;
  tags?: string; // 用于显示的数量字符串
}

// Tag（提示词）
export interface Tag {
  id: string;
  en: string;   // 英文单词
  zh: string;   // 中文释义
  category: string; // 分类
}

// 工作空间-词组关联项
export interface WorkspaceGroupEntry {
  groupId: string;
  type: 'positive' | 'negative'; // 正向/负向
}

// 中间表：工作空间-词组关联
export type WorkspaceGroups = Record<string, WorkspaceGroupEntry[]>;

// 中间表：词组-提示词关联
export type GroupTags = Record<string, string[]>;

// 目录
export interface Folder {
  id: string;
  name: string;
}

// 词组-目录映射
export type GroupFolderMap = Record<string, string>;

// 分类列表
export const CATEGORIES = ['角色', '画风', '构图', '光影', '画质', '场景', '色调', '表情', '姿势', '特效'] as const;
export type Category = typeof CATEGORIES[number];

// Store 状态
export interface StoreState {
  // 数据
  workspaces: Workspace[];
  groups: Group[];
  tags: Tag[];
  workspaceGroups: WorkspaceGroups;
  groupTags: GroupTags;
  folders: Folder[];
  groupFolderMap: GroupFolderMap;
  
  // 计数器
  tagIdCounter: number;
  folderIdCounter: number;
  
  // UI 状态
  sidebarCollapsed: boolean;
  currentWorkspaceId: string | null;
  
  // Actions
  // 工作空间
  addWorkspace: (workspace: Omit<Workspace, 'id' | 'createdAt'>) => Workspace;
  updateWorkspace: (id: string, data: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  setCurrentWorkspace: (id: string) => void;
  
  // 词组
  addGroup: (group: Omit<Group, 'id' | 'color'>, folderId?: string) => Group;
  updateGroup: (id: string, data: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  
  // Tag
  addTag: (tag: Omit<Tag, 'id'>) => Tag;
  updateTag: (id: string, data: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  addTags: (tags: Array<Omit<Tag, 'id'>>) => Tag[];
  
  // 工作空间-词组关联
  linkGroupToWorkspace: (workspaceId: string, groupId: string, type: 'positive' | 'negative') => void;
  unlinkGroupFromWorkspace: (workspaceId: string, groupId: string) => void;
  setGroupType: (workspaceId: string, groupId: string, type: 'positive' | 'negative') => void;
  updateWorkspaceGroupOrder: (workspaceId: string, draggedGroupId: string, targetIndex: number) => void;
  
  // 词组-Tag关联
  linkTagToGroup: (groupId: string, tagId: string) => void;
  unlinkTagFromGroup: (groupId: string, tagId: string) => void;
  toggleTagInGroup: (groupId: string, tagId: string) => void;
  reorderTagsInGroup: (groupId: string, tagIds: string[]) => void;
  
  // 目录
  addFolder: (name: string) => Folder;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  
  // UI
  toggleSidebar: () => void;
  
  // 数据持久化
  loadFromStorage: () => void;
  saveToStorage: () => void;
}
