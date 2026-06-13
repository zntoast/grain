import { useState } from 'react';

export const useToast = () => {
  const [toast, setToast] = useState({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  return { toast, showToast, hideToast };
};
