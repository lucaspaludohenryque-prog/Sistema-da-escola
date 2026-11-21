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
      className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none print:hidden"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-[#1A1D21] dark:text-zinc-200">
          <Smartphone className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Instale o App RCO no seu dispositivo
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Acesso rápido em tela cheia pelo celular ou computador, como um aplicativo nativo.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleInstall}
          disabled={isInstalling}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--school-primary-hover)] disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          <span>{isInstalling ? "Instalando..." : "Instalar App"}</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dispensar aviso de instalação"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-200"
        >
          <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
