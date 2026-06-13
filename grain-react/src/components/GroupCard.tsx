import React from 'react';

interface GroupCardProps {
  group: { id: string; name: string; desc: string };
  type: 'positive' | 'negative';
  tagCount: number;
  isDragging: boolean;
  isDropOver: boolean;
  layoutMode: 'grid' | 'row';
  onDragStart: (e: React.DragEvent, groupId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, groupId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, groupId: string) => void;
  onMouseEnter: (groupId: string) => void;
  onMouseLeave: () => void;
  onEdit: (groupId: string) => void;
  onChangeType: (groupId: string, type: 'positive' | 'negative') => void;
  onUnlink: (groupId: string) => void;
}

export const GroupCard: React.FC<GroupCardProps> = React.memo(({
  group,
  type,
  tagCount,
  isDragging,
  isDropOver,
  layoutMode,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onMouseEnter,
  onMouseLeave,
  onEdit,
  onChangeType,
  onUnlink,
}) => {
  const isPositive = type === 'positive';

  if (layoutMode === 'row') {
    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(e, group.id)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, group.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, group.id)}
        onMouseEnter={() => onMouseEnter(group.id)}
        onMouseLeave={onMouseLeave}
        className={`flex items-center gap-3 px-4 py-2 bg-[#f4efe8] border border-gray-200 rounded-lg hover:border-gray-300 cursor-grab transition-colors ${isDragging ? 'opacity-50' : ''} ${isDropOver ? 'border-accent border-2' : ''}`}
      >
        <span className="text-gray-300 cursor-grab select-none text-sm">⠿</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isPositive ? '正向' : '负面'}
        </span>
        <button onClick={() => onEdit(group.id)} className="text-sm font-medium text-gray-900 hover:text-accent truncate text-left">{group.name}</button>
        <span className="text-xs text-gray-400 ml-auto tabular-nums flex-shrink-0">{tagCount} 词</span>
        <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-md flex-shrink-0">
          {isPositive ? (
            <>
              <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">正向</span>
              <button onClick={() => onChangeType(group.id, 'negative')} className="px-2 py-0.5 rounded text-xs text-gray-400 hover:bg-white hover:text-red-500">负向</button>
            </>
          ) : (
            <>
              <button onClick={() => onChangeType(group.id, 'positive')} className="px-2 py-0.5 rounded text-xs text-gray-400 hover:bg-white hover:text-green-500">正向</button>
              <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium">负向</span>
            </>
          )}
        </div>
        <button onClick={() => onUnlink(group.id)} className="px-2 py-0.5 rounded text-xs text-red-400 hover:bg-red-50 hover:text-red-500 flex-shrink-0">解除</button>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, group.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, group.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, group.id)}
      onMouseEnter={() => onMouseEnter(group.id)}
      onMouseLeave={onMouseLeave}
      className={`bg-[#f4efe8] border border-gray-200 rounded-xl overflow-hidden card-accent-top card-hover cursor-grab ${isDragging ? 'opacity-50' : ''} ${isDropOver ? 'border-accent border-2' : ''}`}
    >
      <div className="px-4 pt-4 flex justify-between items-start">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gray-400 cursor-grab select-none">⠿</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isPositive ? '正向' : '负面'}
          </span>
          <h4 className="text-sm font-semibold tracking-tight truncate">{group.name}</h4>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full flex-shrink-0">{tagCount} 个词</span>
      </div>
      <p className="text-xs text-gray-500 px-4 pt-1.5 leading-relaxed line-clamp-2">{group.desc}</p>
      <div className="px-4 pt-3 pb-2 flex justify-between items-center border-t border-gray-100 mt-3">
        <button onClick={() => onEdit(group.id)} className="text-xs text-accent hover:underline">管理提示词 →</button>
        <div className="flex gap-1.5 items-center">
          <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-md">
            {isPositive ? (
              <>
                <span className="px-2.5 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">正向</span>
                <button onClick={() => onChangeType(group.id, 'negative')} className="px-2.5 py-0.5 rounded text-xs text-gray-500 hover:text-red-600">负向</button>
              </>
            ) : (
              <>
                <button onClick={() => onChangeType(group.id, 'positive')} className="px-2.5 py-0.5 rounded text-xs text-gray-500 hover:text-green-600">正向</button>
                <span className="px-2.5 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium">负向</span>
              </>
            )}
          </div>
          <button onClick={() => onUnlink(group.id)} className="h-7 px-2.5 rounded-md border text-xs text-red-500 border-red-200 bg-transparent hover:bg-red-50">解除关联</button>
        </div>
      </div>
    </div>
  );
});

GroupCard.displayName = 'GroupCard';
