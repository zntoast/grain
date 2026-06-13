import React, { useState } from 'react';
import { Image, RefreshCw, Download } from 'lucide-react';

interface ImagePreviewProps {
  prompt: string;
  tags: string[];
}

// 预设的示例图片（使用 placeholder 图片服务）
const PREVIEW_IMAGES = [
  'https://picsum.photos/seed/grain1/512/512',
  'https://picsum.photos/seed/grain2/512/512',
  'https://picsum.photos/seed/grain3/512/512',
  'https://picsum.photos/seed/grain4/512/512',
  'https://picsum.photos/seed/grain5/512/512',
  'https://picsum.photos/seed/grain6/512/512',
];

export const ImagePreview: React.FC<ImagePreviewProps> = ({ prompt, tags }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    // 模拟加载延迟
    setTimeout(() => {
      setCurrentImage((prev) => (prev + 1) % PREVIEW_IMAGES.length);
      setIsLoading(false);
    }, 800);
  };

  const handleDownload = () => {
    // 创建一个模拟的下载
    const link = document.createElement('a');
    link.href = PREVIEW_IMAGES[currentImage];
    link.download = `grain-preview-${Date.now()}.jpg`;
    link.target = '_blank';
    link.click();
  };

  if (tags.length === 0) {
    return (
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-8 border border-pink-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pink-100 flex items-center justify-center">
            <Image size={28} className="text-pink-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">图片预览</h4>
          <p className="text-xs text-gray-400">
            添加提示词后，可预览生成效果
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-pink-50/50 via-white to-purple-50/30 rounded-2xl border border-pink-100 overflow-hidden">
      {/* 图片展示区 */}
      <div className="relative aspect-square bg-gray-100">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={24} className="text-pink-400 animate-spin" />
              <span className="text-xs text-gray-500">生成预览中...</span>
            </div>
          </div>
        ) : (
          <img
            src={PREVIEW_IMAGES[currentImage]}
            alt="AI 生成预览"
            className="w-full h-full object-cover"
          />
        )}
        
        {/* 浮动提示词标签 */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2.5 shadow-sm">
            <p className="text-[10px] text-gray-400 mb-1">当前提示词</p>
            <p className="text-xs text-gray-700 line-clamp-2 font-mono leading-relaxed">
              {prompt || '暂无提示词'}
            </p>
          </div>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="p-3 flex items-center justify-between bg-white">
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-600">
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              +{tags.length - 3}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors"
            title="刷新预览"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors"
            title="下载图片"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
