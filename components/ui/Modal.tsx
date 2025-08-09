"use client";

import { ReactNode, useEffect } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xl">
        {(title || onClose) && (
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <div className="font-semibold text-[var(--foreground)]">{title}</div>
            <button
              onClick={onClose}
              className="text-[var(--muted-foreground)] hover:opacity-80"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-[var(--border)]">{footer}</div>}
      </div>
    </div>
  );
}

