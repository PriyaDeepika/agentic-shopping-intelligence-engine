"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiXCircle, FiInfo, FiX } from "react-icons/fi";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => dismissToast(id), 4500);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg bg-white ${
                toast.variant === "success"
                  ? "border-green-200"
                  : toast.variant === "error"
                  ? "border-red-200"
                  : "border-black/10"
              }`}
              role="status"
            >
              <span className="mt-0.5 shrink-0">
                {toast.variant === "success" && (
                  <FiCheckCircle className="text-green-600 text-xl" />
                )}
                {toast.variant === "error" && (
                  <FiXCircle className="text-red-600 text-xl" />
                )}
                {toast.variant === "info" && (
                  <FiInfo className="text-black/60 text-xl" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-black">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-black/60 mt-0.5 break-words">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-black/40 hover:text-black/70 transition-colors"
                aria-label="Dismiss notification"
              >
                <FiX />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
