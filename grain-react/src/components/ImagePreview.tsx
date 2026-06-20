import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, ZoomIn } from 'lucide-react';
import { saveImage, loadImage, deleteImage } from '../services/imageStorage';

interface ImagePreviewProps {
  imageUrl?: string;
  onImageChange?: (url: string) => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl: initialUrl, onImageChange }) => {
  const [displayUrl, setDisplayUrl] = useState('');
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialUrl) { setDisplayUrl(''); return; }
    if (initialUrl.startsWith('http') || initialUrl.startsWith('blob:')) {
      setDisplayUrl(initialUrl);
    } else if (initialUrl.startsWith('img_')) {
      loadImage(initialUrl).then((url) => setDisplayUrl(url || ''));
    }
  }, [initialUrl]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 压缩大图
    let blob: Blob = file;
    if (file.size > 1024 * 1024) {
      const img = await new Promise<HTMLImageElement>((resolve) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.src = URL.createObjectURL(file);
      });
      URL.revokeObjectURL(img.src);
      const max = 400;
      const scale = Math.min(max / img.width, max / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.7));
    }

    const id = await saveImage(blob);
    onImageChange?.(id);
  };

  const handleRemove = async () => {
    if (initialUrl && initialUrl.startsWith('img_')) {
      await deleteImage(initialUrl);
    }
    onImageChange?.('');
    setDisplayUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-pink-100">
        <div className="relative w-full" style={{ minHeight: '160px' }}>
          {displayUrl ? (
            <>
              <img
                src={displayUrl}
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
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 hover:bg-pink-50/50 transition-colors rounded-xl"
              aria-label="上传预览图"
            >
              <Upload size={20} className="text-pink-400" />
              <span className="text-xs text-gray-500">上传图片</span>
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

      {showModal && displayUrl && (
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
            src={displayUrl}
            alt="预览大图"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
