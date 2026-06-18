import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChange,
  placeholder = '搜索...',
  className = '',
}) => {
  return (
    <div className={`form-control flex items-center gap-2 h-9 px-3 ${className}`}>
      <Search size={16} className="text-gray-400 flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="control-press w-7 h-7 -mr-2 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#f4efed]"
          aria-label="清空搜索"
          title="清空搜索"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
