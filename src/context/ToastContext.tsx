import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type ToastType = 'info' | 'success' | 'error' | 'gold';
export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastApi {
  toast: (message: string, type?: ToastType, title?: string) => void;
  toasts: Toast[];
  dismiss: (id: number) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (message: string, type: ToastType = 'info', title?: string) => {
      const id = idRef.current++;
      setToasts((t) => [...t.slice(-4), { id, message, type, title }]);
      window.setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3800);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ toast, toasts, dismiss }), [toast, toasts, dismiss]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type} fade-up`} role="status" onClick={() => dismiss(t.id)}>
            {t.title && <strong>{t.title}</strong>}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast outside ToastProvider');
  return v;
}
