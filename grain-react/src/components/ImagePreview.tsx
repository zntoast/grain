import React, { useState } from 'react';
import { RefreshCw, Download, X, ZoomIn } from 'lucide-react';

interface ImagePreviewProps {
  prompt?: string;
  tags?: string[];
}

const PREVIEW_IMAGES = [
  'https://picsum.photos/seed/grain1/800/450',
  'https://picsum.photos/seed/grain2/800/450',
  'https://picsum.photos/seed/grain3/800/450',
  'https://picsum.photos/seed/grain4/800/450',
  'https://picsum.photos/seed/grain5/800/450',
  'https://picsum.photos/seed/grain6/800/450',
];

export const ImagePreview: React.FC<ImagePreviewProps> = () => {
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

  return (
    <>
      <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-pink-100">
        {/* 16:9 比例容器 */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <RefreshCw size={20} className="text-pink-400 animate-spin" />
            </div>
          ) : (
            <>
              <img
                src={PREVIEW_IMAGES[currentImage]}
                alt="预览"
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                onClick={() => setShowModal(true)}
              />
              {/* 悬停遮罩 */}
              <div 
                className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100"
                onClick={() => setShowModal(true)}
              >
                <ZoomIn size={24} className="text-white" />
              </div>
            </>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-600 hover:text-pink-500 transition-colors backdrop-blur-sm"
            title="刷新"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-600 hover:text-pink-500 transition-colors backdrop-blur-sm"
            title="下载"
          >
            <Download size={14} />
          </button>
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
