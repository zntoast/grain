import type { Tag } from '../types';

export const R18_CATEGORY = 'R18';

export const isR18Category = (category: string): boolean => category.trim() === R18_CATEGORY;

export const filterVisibleCategories = <T extends string>(
  categories: readonly T[],
  showR18Category: boolean,
): T[] => {
  if (showR18Category) return [...categories];
  return categories.filter((category) => !isR18Category(category));
};

export const filterVisibleTags = <T extends Pick<Tag, 'category'>>(
  tags: readonly (T | null | undefined)[],
  showR18Category: boolean,
): T[] => {
  return tags.filter((tag): tag is T => {
    if (!tag) return false;
    return showR18Category || !isR18Category(tag.category);
  });
};
