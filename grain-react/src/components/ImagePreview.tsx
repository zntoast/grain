import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, ZoomIn } from 'lucide-react';

interface ImagePreviewProps {
  imageUrl?: string;
  onImageChange?: (url: string) => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl: initialUrl, onImageChange }) => {
  const [imageUrl, setImageUrl] = useState(initialUrl || '');
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当外部 imageUrl prop 变化时同步内部状态
  useEffect(() => {
    setImageUrl(initialUrl || '');
  }, [initialUrl]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImageUrl(base64);
        onImageChange?.(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setImageUrl('');
    onImageChange?.('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-pink-100">
        {/* 16:9 比例容器 */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt="预览"
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                onClick={() => setShowModal(true)}
              />
              <div 
                className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100"
                onClick={() => setShowModal(true)}
              >
                <ZoomIn size={20} className="text-white" />
              </div>
              {/* 删除按钮 */}
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-600 hover:text-red-500 transition-colors backdrop-blur-sm"
                title="移除图片"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center hover:bg-pink-50/50 transition-colors"
            >
              <Upload size={20} className="text-pink-400 mb-1" />
              <span className="text-xs text-gray-500">上传预览图</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* 放大预览弹窗 */}
      {showModal && imageUrl && (
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
            src={imageUrl}
            alt="预览大图"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
