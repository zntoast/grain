import React, { useState } from 'react';
import { Image, RefreshCw, Download, X, ZoomIn } from 'lucide-react';

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
  const [showModal, setShowModal] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentImage((prev) => (prev + 1) % PREVIEW_IMAGES.length);
      setIsLoading(false);
    }, 800);
  };

  const handleDownload = () => {
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
    <>
      <div className="bg-gradient-to-br from-pink-50/50 via-white to-purple-50/30 rounded-xl border border-pink-100 overflow-hidden">
        <div className="p-3">
          {/* 图片区域 - 更大 */}
          <div 
            className="relative h-48 rounded-lg bg-gray-100 overflow-hidden mb-3 cursor-pointer group"
            onClick={() => setShowModal(true)}
          >
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <RefreshCw size={20} className="text-pink-400 animate-spin" />
              </div>
            ) : (
              <>
                <img
                  src={PREVIEW_IMAGES[currentImage]}
                  alt="预览"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </>
            )}
          </div>

          {/* 内容区 */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1 max-w-[70%]">
              {tags.slice(0, 4).map((tag, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-600 truncate max-w-[80px]">
                  {tag}
                </span>
              ))}
              {tags.length > 4 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                  +{tags.length - 4}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors"
                title="刷新"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors"
                title="下载"
              >
                <Download size={14} />
              </button>
            </div>
          </div>

          {/* 提示词 */}
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-400 mb-0.5">提示词</p>
            <p className="text-[11px] text-gray-600 line-clamp-2 font-mono leading-relaxed">
              {prompt || '暂无提示词'}
            </p>
          </div>
        </div>
      </div>

      {/* 放大预览弹窗 */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setShowModal(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setShowModal(false)}
          >
            <X size={20} />
          </button>
          <img
            src={PREVIEW_IMAGES[currentImage]}
            alt="预览大图"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
