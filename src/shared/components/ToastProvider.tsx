"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastEntry {
  id: string;
  variant: ToastVariant;
  message: string;
  title?: string;
}

interface ToastContextValue {
  push: (variant: ToastVariant, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 4000;
const MAX_VISIBLE_TOASTS = 4;

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  {
    dot: string;
    iconClass: string;
    icon: typeof CheckCircle2;
  }
> = {
  success: {
    dot: "bg-emerald-500",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  error: {
    dot: "bg-red-500",
    iconClass: "text-red-600 dark:text-red-400",
    icon: AlertCircle,
  },
  warning: {
    dot: "bg-amber-500",
    iconClass: "text-amber-600 dark:text-amber-400",
    icon: AlertTriangle,
  },
  info: {
    dot: "bg-blue-500",
    iconClass: "text-blue-600 dark:text-blue-400",
    icon: Info,
  },
};

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string, title?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((prev) => {
        const next = [...prev, { id, variant, message, title }];
        if (next.length > MAX_VISIBLE_TOASTS) {
          const removed = next.shift();
          if (removed) {
            const oldTimer = timersRef.current.get(removed.id);
            if (oldTimer !== undefined) {
              window.clearTimeout(oldTimer);
              timersRef.current.delete(removed.id);
            }
          }
        }
        return next;
      });

      const timer = window.setTimeout(() => {
        dismiss(id);
      }, AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (message, title) => push("success", message, title),
      error: (message, title) => push("error", message, title),
      warning: (message, title) => push("warning", message, title),
      info: (message, title) => push("info", message, title),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5 sm:right-6 sm:bottom-6 print:hidden"
      >
        {toasts.map((entry) => {
          const style = VARIANT_STYLES[entry.variant];
          const Icon = style.icon;

          return (
            <div
              key={entry.id}
              role={entry.variant === "error" ? "alert" : "status"}
              className="rco-toast-enter pointer-events-auto flex items-start gap-3 rounded-xl border border-zinc-200/90 bg-white p-3.5 text-zinc-900 shadow-[var(--shadow-popover)] dark:border-white/10 dark:bg-[#1A1D21] dark:text-zinc-100"
            >
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                <Icon
                  className={`h-4 w-4 ${style.iconClass}`}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                {entry.title ? (
                  <div className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`}
                    />
                    <p className="text-xs font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
                      {entry.title}
                    </p>
                  </div>
                ) : null}
                <p
                  className={`text-sm leading-snug text-zinc-600 dark:text-zinc-300 ${
                    entry.title ? "mt-0.5" : ""
                  }`}
                >
                  {entry.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismiss(entry.id)}
                aria-label="Fechar notificação"
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/[0.08] dark:hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de ToastProvider.");
  }
  return ctx;
}
