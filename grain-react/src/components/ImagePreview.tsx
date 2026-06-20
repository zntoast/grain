import React, { useState, useRef } from 'react';
import { Upload, X, ZoomIn, Link } from 'lucide-react';

interface ImagePreviewProps {
  imageUrl?: string;
  onImageChange?: (url: string) => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl: initialUrl, onImageChange }) => {
  const imageUrl = initialUrl || '';
  const [showModal, setShowModal] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 超过 1MB 的图片压缩后再存储
    if (file.size > 1024 * 1024) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const max = 400;
        const scale = Math.min(max / img.width, max / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        onImageChange?.(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = url;
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onImageChange?.(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (urlValue.trim()) {
      onImageChange?.(urlValue.trim());
      setShowUrlInput(false);
      setUrlValue('');
    }
  };

  const handleRemove = () => {
    onImageChange?.('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-pink-100">
        <div className="relative w-full" style={{ minHeight: '160px' }}>
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt="预览"
                className="w-full h-full object-contain cursor-pointer max-h-48"
                onClick={() => setShowModal(true)}
              />
              <div
                className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100"
                onClick={() => setShowModal(true)}
              >
                <ZoomIn size={20} className="text-white" />
              </div>
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-600 hover:text-red-500 transition-colors backdrop-blur-sm"
                title="移除图片"
                aria-label="移除图片"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1 hover:bg-pink-50/50 transition-colors p-4 rounded-xl w-full"
                aria-label="上传预览图"
              >
                <Upload size={20} className="text-pink-400" />
                <span className="text-xs text-gray-500">上传图片</span>
              </button>
              <span className="text-xs text-gray-300">或</span>
              <button
                onClick={() => setShowUrlInput(true)}
                className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-500"
              >
                <Link size={12} />
                输入图片链接
              </button>
            </div>
          )}
        </div>

        {showUrlInput && (
          <div className="border-t border-pink-100 p-2 flex gap-2">
            <input
              type="text"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 h-8 px-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-accent"
              onKeyDown={(e) => { if (e.key === 'Enter') handleUrlSubmit(); }}
              autoFocus
            />
            <button
              onClick={handleUrlSubmit}
              disabled={!urlValue.trim()}
              className="h-8 px-3 text-xs font-medium text-white bg-accent rounded-lg hover:bg-[#d94d82] disabled:opacity-40"
            >
              确认
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {showModal && imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setShowModal(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setShowModal(false)}
            aria-label="关闭预览"
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
