import React from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface TagChipProps {
  en: string;
  zh?: string;
  selected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onRemove?: () => void;
  showCheckbox?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const TagChip: React.FC<TagChipProps> = ({
  en,
  zh,
  selected,
  onClick,
  onDoubleClick,
  onRemove,
  showCheckbox = false,
  size = 'md',
  className,
}) => {
  return (
    <span
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={clsx(
        'control-press inline-flex items-center gap-1.5 rounded-full border cursor-pointer',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
        selected
          ? 'bg-[#fff0f5] text-[#b52f64] border-[#efacc4] shadow-sm'
          : 'bg-[#fffefc] border-[#e8e2e3] text-gray-700 hover:border-[#e8b8c9] hover:bg-[#fff8fa]',
        className
      )}
    >
      {showCheckbox && (
        <span
          className={clsx(
            'w-4 h-4 rounded border flex items-center justify-center',
            selected ? 'bg-accent border-accent' : 'border-gray-300 bg-white'
          )}
        >
          {selected && (
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="currentColor">
              <path d="M10.28 2.28L4 8.56 1.72 6.28A.75.75 0 00.28 7.72l3 3a.75.75 0 001.06 0l7-7a.75.75 0 00-1.06-1.06z" />
            </svg>
          )}
        </span>
      )}
      <span className="font-mono font-semibold">{en}</span>
      {zh && (
        <span className={clsx('font-sans', selected ? 'text-[#c65b83]' : 'text-gray-500', size === 'sm' ? 'text-[10px]' : 'text-xs')}>
          ({zh})
        </span>
      )}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={clsx(
            'ml-0.5 w-5 h-5 -mr-1 inline-flex items-center justify-center rounded-full hover:bg-black/5',
            selected ? 'text-[#b52f64]' : 'text-gray-400'
          )}
          aria-label={`移除 ${en}`}
          title="移除"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
};
