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
    container: string;
    iconWrap: string;
    icon: typeof CheckCircle2;
  }
> = {
  success: {
    container:
      "border-emerald-200/90 bg-white text-slate-900 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-slate-100",
    iconWrap:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  error: {
    container:
      "border-red-200/90 bg-white text-slate-900 dark:border-red-500/30 dark:bg-slate-900 dark:text-slate-100",
    iconWrap: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    icon: AlertCircle,
  },
  warning: {
    container:
      "border-amber-200/90 bg-white text-slate-900 dark:border-amber-500/30 dark:bg-slate-900 dark:text-slate-100",
    iconWrap:
      "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    icon: AlertTriangle,
  },
  info: {
    container:
      "border-blue-200/90 bg-white text-slate-900 dark:border-blue-500/30 dark:bg-slate-900 dark:text-slate-100",
    iconWrap: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
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
              className={`rco-toast-enter pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 ${style.container}`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.iconWrap}`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                {entry.title ? (
                  <p className="text-xs font-semibold tracking-tight">
                    {entry.title}
                  </p>
                ) : null}
                <p className="text-sm leading-snug text-slate-700 dark:text-slate-200">
                  {entry.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismiss(entry.id)}
                aria-label="Fechar notificação"
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
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
