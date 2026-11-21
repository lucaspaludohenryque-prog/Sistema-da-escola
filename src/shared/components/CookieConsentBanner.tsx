"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

const COOKIE_CONSENT_KEY = "rco_cookie_consent";

export function CookieConsentBanner(): React.JSX.Element | null {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!saved) {
        setIsVisible(true);
      }
    } catch {
      // Se localStorage estiver indisponivel, mantem o banner oculto para nao travar a navegacao.
    }
  }, []);

  function handleAccept(): void {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    } catch {
      // Ignora erro de escrita caso armazenamento esteja bloqueado.
    }
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  const isDashboardRoute = pathname.startsWith("/dashboard");

  return (
    <aside
      role="region"
      aria-label="Aviso de cookies essenciais"
      className={`fixed right-3 left-3 z-40 sm:right-auto sm:left-4 sm:w-full sm:max-w-sm print:hidden ${
        isDashboardRoute ? "bottom-20 md:bottom-4" : "bottom-4"
      }`}
    >
      <div className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-[var(--shadow-popover)] dark:border-white/10 dark:bg-[#131518]">
        <div className="flex items-start gap-2.5">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
              Utilizamos apenas cookies essenciais para manter seu acesso seguro
              e salvar preferências como o tema escuro. Não usamos cookies de
              anúncios.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-3 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <Link
                  href="/cookies"
                  className="underline underline-offset-2 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Política de Cookies
                </Link>
                <Link
                  href="/privacidade"
                  className="underline underline-offset-2 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Privacidade
                </Link>
              </div>

              <button
                type="button"
                onClick={handleAccept}
                className="inline-flex h-7 cursor-pointer items-center justify-center rounded-lg bg-zinc-900 px-3 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
