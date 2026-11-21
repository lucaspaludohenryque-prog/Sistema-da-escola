"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const DISMISS_STORAGE_KEY = "rco-pwa-install-dismissed";

export function InstallAppBanner(): React.JSX.Element | null {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        Boolean(
          (window.navigator as Navigator & { standalone?: boolean }).standalone
        ));

    if (isStandalone) {
      return;
    }

    try {
      const savedDismiss = window.localStorage.getItem(DISMISS_STORAGE_KEY);
      setIsDismissed(savedDismiss === "1");
    } catch {
      setIsDismissed(false);
    }

    function handleBeforeInstallPrompt(event: Event): void {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled(): void {
      setDeferredPrompt(null);
      setIsDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!deferredPrompt || isDismissed) {
    return null;
  }

  async function handleInstall(): Promise<void> {
    if (!deferredPrompt || isInstalling) {
      return;
    }

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        setIsDismissed(true);
      }
    } finally {
      setIsInstalling(false);
    }
  }

  function handleDismiss(): void {
    setIsDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
    } catch {
      // Ignora erro caso localStorage esteja indisponivel.
    }
  }

  return (
    <div
      role="region"
      aria-label="Instalar aplicativo RCO"
      className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900 print:hidden"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: "var(--school-primary-soft)",
            color: "var(--school-primary)",
          }}
        >
          <Smartphone className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Instale o App RCO no seu dispositivo
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acesso rápido em tela cheia pelo celular ou computador, como um aplicativo nativo.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleInstall}
          disabled={isInstalling}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98] disabled:opacity-70"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          <span>{isInstalling ? "Instalando..." : "Instalar App RCO"}</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dispensar aviso de instalação"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
