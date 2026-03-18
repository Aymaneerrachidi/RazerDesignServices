"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((item: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { ...item, id }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const success = useCallback((title: string, message?: string) => toast({ type: "success", title, message }), [toast]);
  const error = useCallback((title: string, message?: string) => toast({ type: "error", title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: "warning", title, message }), [toast]);
  const info = useCallback((title: string, message?: string) => toast({ type: "info", title, message }), [toast]);

  const iconMap = {
    success: <CheckCircle size={16} className="text-neon" />,
    error: <XCircle size={16} className="text-red-400" />,
    warning: <AlertCircle size={16} className="text-amber-400" />,
    info: <Info size={16} className="text-blue-400" />,
  };

  const colorMap = {
    success: "border-neon/25 bg-neon/5",
    error: "border-red-500/25 bg-red-500/5",
    warning: "border-amber-500/25 bg-amber-500/5",
    info: "border-blue-500/25 bg-blue-500/5",
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] space-y-3 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "glass rounded-xl border p-4 shadow-card flex gap-3 items-start",
              colorMap[t.type]
            )}
            style={{ animation: "slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <div className="mt-0.5 flex-shrink-0">{iconMap[t.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary font-display">{t.title}</p>
              {t.message && (
                <p className="text-xs text-text-secondary mt-0.5 font-body">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// Inline re-export for easier import
export { ToastContext };
