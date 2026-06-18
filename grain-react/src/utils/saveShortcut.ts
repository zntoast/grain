type SaveShortcutEvent = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey'> & {
  repeat?: boolean;
};

export const isSaveShortcut = (event: SaveShortcutEvent): boolean =>
  !event.repeat && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
