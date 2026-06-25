import type {
  Group,
  GroupTags,
  Tag,
  WorkspaceGroupEntry,
  WorkspacePromptConfig,
  WorkspacePromptItem,
} from '../types';

export const normalizePromptText = (value: string) =>
  value.trim().toLowerCase().replace(/[\s_-]+/g, '');

export const findDuplicateTagGroups = (tags: Tag[]) => {
  const grouped = new Map<string, Tag[]>();
  tags.forEach((tag) => {
    const key = normalizePromptText(tag.en);
    if (!key) return;
    grouped.set(key, [...(grouped.get(key) || []), tag]);
  });
  return [...grouped.values()].filter((items) => items.length > 1);
};

export const mergeTagReferences = (
  tagIds: string[],
  keepId: string,
  removeIds: string[],
) => {
  const removed = new Set(removeIds);
  const result: string[] = [];
  tagIds.forEach((id) => {
    const nextId = removed.has(id) ? keepId : id;
    if (!result.includes(nextId)) result.push(nextId);
  });
  return result;
};

export const formatWeightedPrompt = (prompt: string, weight = 1) => {
  if (!Number.isFinite(weight) || weight === 1) return prompt;
  return `(${prompt}:${Number(weight.toFixed(2))})`;
};

export const moveItem = <T>(items: T[], fromIndex: number, toIndex: number) => {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return [...items];
  }
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

export const trimHistory = <T>(history: T[]) => history.slice(0, 30);

interface BuildWorkspacePromptItemsInput {
  entries: WorkspaceGroupEntry[];
  groups: Group[];
  groupTags: GroupTags;
  tags: Tag[];
  promptOrder?: string[];
}

export const buildWorkspacePromptItems = ({
  entries,
  groups,
  groupTags,
  tags,
  promptOrder = [],
}: BuildWorkspacePromptItemsInput): WorkspacePromptItem[] => {
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const items: WorkspacePromptItem[] = [];

  entries.forEach((entry) => {
    const group = groupById.get(entry.groupId);
    if (!group) return;
    (groupTags[group.id] || []).forEach((tagId) => {
      const tag = tagById.get(tagId);
      if (!tag) return;
      items.push({
        key: `${group.id}:tag:${tag.id}`,
        groupId: group.id,
        groupName: group.name,
        type: entry.type,
        prompt: tag.en,
        zh: tag.zh,
      });
    });
    (group.customTags || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((prompt, index) => {
        items.push({
          key: `${group.id}:custom:${index}`,
          groupId: group.id,
          groupName: group.name,
          type: entry.type,
          prompt,
          zh: '',
        });
      });
  });

  const orderIndex = new Map(promptOrder.map((key, index) => [key, index]));
  return items
    .map((item, naturalIndex) => ({ item, naturalIndex }))
    .sort((a, b) => {
      const aIndex = orderIndex.get(a.item.key);
      const bIndex = orderIndex.get(b.item.key);
      if (aIndex !== undefined && bIndex !== undefined) return aIndex - bIndex;
      if (aIndex !== undefined) return -1;
      if (bIndex !== undefined) return 1;
      return a.naturalIndex - b.naturalIndex;
    })
    .map(({ item }) => item);
};

export const createPromptOutput = (
  items: WorkspacePromptItem[],
  config: WorkspacePromptConfig,
) => {
  const disabledGroups = new Set(config.disabledGroupIds);
  const disabledPrompts = new Set(config.disabledPromptKeys);
  const enabled = items.filter(
    (item) => !disabledGroups.has(item.groupId) && !disabledPrompts.has(item.key),
  );
  const format = (item: WorkspacePromptItem) =>
    formatWeightedPrompt(item.prompt, config.weights[item.key] ?? 1);
  return {
    positiveText: enabled.filter((item) => item.type === 'positive').map(format).join(', '),
    negativeText: enabled.filter((item) => item.type === 'negative').map(format).join(', '),
  };
};
