import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GripVertical, Star } from 'lucide-react';
import { loadImage } from '../services/imageStorage';

interface GroupCardProps {
  group: { id: string; name: string; desc: string };
  type: 'positive' | 'negative';
  tagCount: number;
  tags?: string[];
  previewImageUrl?: string;
  disabled?: boolean;
  onToggle?: () => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
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
  tags = [],
  previewImageUrl,
  disabled,
  onToggle,
  favorite,
  onToggleFavorite,
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
  const navigate = useNavigate();
  const isPositive = type === 'positive';
  const [showPreview, setShowPreview] = useState(false);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const [previewDisplayUrl, setPreviewDisplayUrl] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (!previewImageUrl) {
      setPreviewDisplayUrl('');
      return;
    }
    if (previewImageUrl.startsWith('http') || previewImageUrl.startsWith('blob:')) {
      setPreviewDisplayUrl(previewImageUrl);
      return;
    }
    if (previewImageUrl.startsWith('img_')) {
      loadImage(previewImageUrl).then((url) => {
        if (!cancelled) setPreviewDisplayUrl(url || '');
      });
      return () => {
        cancelled = true;
      };
    }
    setPreviewDisplayUrl(previewImageUrl);
    return () => {
      cancelled = true;
    };
  }, [previewImageUrl]);

  const handleMouseEnter = () => {
    onMouseEnter(group.id);
    if (previewImageUrl && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setPreviewPos({ x: rect.right + 10, y: rect.top });
      setShowPreview(true);
    }
  };

  const handleMouseLeave = () => {
    onMouseLeave();
    setShowPreview(false);
  };

  if (layoutMode === 'row') {
    return (
      <>
        <div
          ref={cardRef}
          onDragOver={(e) => onDragOver(e, group.id)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, group.id)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`surface-card flex items-center gap-3 px-4 py-2.5 transition-colors ${isDragging ? 'opacity-50' : ''} ${isDropOver ? 'border-accent ring-2 ring-accent/15' : ''} ${disabled ? 'opacity-50 grayscale' : ''}`}
        >
          <div
            draggable
            onDragStart={(e) => onDragStart(e, group.id)}
            onDragEnd={onDragEnd}
            className="cursor-grab text-gray-300 hover:text-gray-500"
          >
            <GripVertical size={14} />
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isPositive ? '正向' : '负面'}
          </span>
          <button onClick={() => navigate(`/group/${group.id}`)} className="text-sm font-medium text-gray-900 hover:text-accent truncate text-left">{group.name}</button>
          <span className="text-xs text-gray-400 ml-auto tabular-nums flex-shrink-0">{tagCount} 词</span>
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              className={`icon-control !w-7 !h-7 ${favorite ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500'}`}
              title={favorite ? '取消收藏' : '收藏词组'}
              aria-label={favorite ? '取消收藏' : '收藏词组'}
            >
              <Star size={14} fill={favorite ? 'currentColor' : 'none'} />
            </button>
          )}
          {onToggle && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className={`control-press w-8 h-[18px] rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${!disabled ? 'bg-emerald-400' : 'bg-gray-300'}`}
              title={disabled ? '点击启用' : '点击禁用'}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${!disabled ? 'translate-x-3.5' : ''}`} />
            </button>
          )}
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

        {/* 图片预览浮窗 */}
        {showPreview && previewDisplayUrl && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{ left: previewPos.x, top: previewPos.y }}
          >
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-1 w-48">
              <img
                src={previewDisplayUrl}
                alt="预览"
                className="w-full h-28 object-cover rounded-lg"
              />
              <div className="p-1.5">
                <p className="text-[10px] text-gray-500 line-clamp-2">{tags.slice(0, 5).join(', ')}</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div
        ref={cardRef}
        onDragOver={(e) => onDragOver(e, group.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, group.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`surface-card overflow-hidden card-hover transition-all ${isDragging ? 'opacity-50' : ''} ${isDropOver ? 'border-accent ring-2 ring-accent/15' : ''} ${disabled ? 'opacity-50 grayscale' : ''}`}
      >
        <div className="px-4 pt-4 flex justify-between items-start">
          <div className="flex items-center gap-2 min-w-0">
            <div
              draggable
              onDragStart={(e) => onDragStart(e, group.id)}
              onDragEnd={onDragEnd}
              className="cursor-grab text-gray-400 hover:text-gray-600"
            >
              <GripVertical size={14} />
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isPositive ? '正向' : '负面'}
            </span>
            <button onClick={() => navigate(`/group/${group.id}`)} className="text-sm font-semibold tracking-tight truncate hover:text-accent">{group.name}</button>
          </div>
          <div className="flex items-center gap-1.5">
            {onToggleFavorite && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                className={`icon-control !w-7 !h-7 ${favorite ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500'}`}
                title={favorite ? '取消收藏' : '收藏词组'}
                aria-label={favorite ? '取消收藏' : '收藏词组'}
              >
                <Star size={14} fill={favorite ? 'currentColor' : 'none'} />
              </button>
            )}
            {onToggle && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`control-press w-8 h-[18px] rounded-full transition-colors flex items-center px-0.5 ${!disabled ? 'bg-emerald-400' : 'bg-gray-300'}`}
                title={disabled ? '点击启用' : '点击禁用'}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${!disabled ? 'translate-x-3.5' : ''}`} />
              </button>
            )}
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full flex-shrink-0">{tagCount} 个词</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 px-4 pt-1.5 leading-relaxed line-clamp-2">{group.desc}</p>
        <div className="px-4 py-3 flex justify-between items-center border-t border-[#eee7e8] mt-3 bg-[#fdfaf8]/70">
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

      {/* 图片预览浮窗 */}
      {showPreview && previewDisplayUrl && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: previewPos.x, top: previewPos.y }}
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-1 w-48">
            <img
              src={previewDisplayUrl}
              alt="预览"
              className="w-full h-28 object-cover rounded-lg"
            />
            <div className="p-1.5">
              <p className="text-[10px] text-gray-500 line-clamp-2">{tags.slice(0, 5).join(', ')}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

GroupCard.displayName = 'GroupCard';
