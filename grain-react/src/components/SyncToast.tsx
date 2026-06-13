import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SyncMessage {
  id: number;
  ok: boolean;
}

let msgId = 0;

export const SyncToast: React.FC = () => {
  const [messages, setMessages] = useState<SyncMessage[]>([]);
  const messagesLengthRef = useRef(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ ok: boolean }>).detail;
      console.log('[SyncToast] 收到事件:', detail.ok ? '成功' : '失败', '当前消息数:', messagesLengthRef.current + 1);
      const id = ++msgId;
      setMessages((prev) => {
        messagesLengthRef.current = prev.length + 1;
        return [...prev.slice(-2), { id, ok: detail.ok }];
      });
      setTimeout(() => {
        setMessages((prev) => {
          messagesLengthRef.current = prev.length - 1;
          return prev.filter((m) => m.id !== id);
        });
      }, 5000);
    };

    console.log('[SyncToast] 组件已挂载, 监听 grain-sync-result');
    window.addEventListener('grain-sync-result', handler);
    return () => {
      console.log('[SyncToast] 组件卸载');
      window.removeEventListener('grain-sync-result', handler);
    };
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm pointer-events-auto transition-all ${
            msg.ok
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}
        >
          {msg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {msg.ok ? '本地同步成功' : '本地同步失败'}
        </div>
      ))}
    </div>
  );
};
