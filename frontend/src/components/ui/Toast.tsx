import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

let addToastFn: ((type: ToastType, message: string) => void) | null = null;

export function toast(type: ToastType, message: string) {
  addToastFn?.(type, message);
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const fn = addToast;
    addToastFn = fn;
    return () => {
      if (addToastFn === fn) addToastFn = null;
    };
  });

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-accent-500" />,
    error: <AlertCircle className="h-5 w-5 text-error" />,
    info: <Info className="h-5 w-5 text-primary-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-accent-500',
    error: 'bg-red-50 border-error',
    info: 'bg-primary-50 border-primary-500',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg ${bgColors[t.type]} bg-white`}
          >
            {icons[t.type]}
            <span className="text-sm text-neutral-900">{t.message}</span>
            <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} className="ml-2">
              <X className="h-4 w-4 text-neutral-400" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
