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
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
            <Image size={18} className="text-pink-400" />
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-700">图片预览</h4>
            <p className="text-[11px] text-gray-400">添加提示词后可预览</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-pink-50/50 via-white to-purple-50/30 rounded-xl border border-pink-100 overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* 缩略图 */}
        <div className="relative w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <RefreshCw size={16} className="text-pink-400 animate-spin" />
            </div>
          ) : (
            <img
              src={PREVIEW_IMAGES[currentImage]}
              alt="预览"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* 内容区 */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 mb-1">当前提示词</p>
          <p className="text-[11px] text-gray-700 line-clamp-2 font-mono leading-relaxed mb-2">
            {prompt || '暂无提示词'}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag, i) => (
                <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-pink-50 text-pink-600">
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 text-gray-500">
                  +{tags.length - 2}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleRefresh}
                className="p-1 rounded text-gray-400 hover:text-pink-500 transition-colors"
                title="刷新"
              >
                <RefreshCw size={12} />
              </button>
              <button
                onClick={handleDownload}
                className="p-1 rounded text-gray-400 hover:text-pink-500 transition-colors"
                title="下载"
              >
                <Download size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
