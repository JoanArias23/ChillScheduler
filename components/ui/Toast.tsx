"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; title?: string; message: string; tone?: "info" | "success" | "warning" | "danger" };

const ToastCtx = createContext<{
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  remove: (id: number) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3500);
  }, []);
  const remove = useCallback((id: number) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);
  const value = useMemo(() => ({ toasts, push, remove }), [toasts, push, remove]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 grid gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-64 max-w-sm p-3 rounded-md border shadow-sm bg-[var(--surface)] border-[var(--border)] text-sm ${
              t.tone === "success"
                ? "text-green-700"
                : t.tone === "warning"
                ? "text-amber-700"
                : t.tone === "danger"
                ? "text-red-700"
                : "text-[var(--foreground)]"
            }`}
          >
            {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
            <div>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

