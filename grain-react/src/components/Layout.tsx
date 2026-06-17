import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 480;
const STORAGE_KEY = 'grain_sidebar_width';

const getSavedWidth = (): number => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v) {
      const n = parseInt(v, 10);
      if (n >= SIDEBAR_MIN && n <= SIDEBAR_MAX) return n;
    }
  } catch { /* ignore */ }
  return 272;
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarWidth, setSidebarWidth] = useState(getSavedWidth);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidthRef.current + delta));
      setSidebarWidth(next);
    };

    const onMouseUp = () => {
      setDragging(false);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging]);

  // persist width
  useEffect(() => {
    if (!dragging) {
      try { localStorage.setItem(STORAGE_KEY, String(sidebarWidth)); } catch { /* ignore */ }
    }
  }, [sidebarWidth, dragging]);

  return (
    <div className="flex min-h-screen">
      <div style={{ width: sidebarWidth, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* 拖拽分隔条 */}
      <div
        onMouseDown={onMouseDown}
        className={`w-1.5 flex-shrink-0 cursor-col-resize transition-colors ${
          dragging ? 'bg-accent' : 'bg-transparent hover:bg-accent/30'
        }`}
      />

      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
};
