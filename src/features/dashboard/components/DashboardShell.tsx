"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, LogOut, Menu } from "lucide-react";
import { ROLE_BADGE_STYLES, ROLE_LABELS } from "@/features/auth/constants";
import type { PublicUser } from "@/features/auth/types";
import { resolveDashboardSectionTitle } from "../constants";
import { SidebarNav } from "./SidebarNav";

interface DashboardShellProps {
  user: PublicUser;
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  children,
}: DashboardShellProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const sectionTitle = resolveDashboardSectionTitle(pathname);
  const roleLabel = ROLE_LABELS[user.role];
  const roleBadgeClass = ROLE_BADGE_STYLES[user.role];

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  async function handleLogout(): Promise<void> {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[100dvh] bg-[#F6F8FA]">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-[#1E40AF] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Ir para o conteúdo principal
      </a>

      {/* Sidebar fixa no desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        <SidebarNav />
      </aside>

      {/* Drawer lateral responsivo no mobile */}
      {isMobileMenuOpen ? (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px] transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[82vw] border-r border-slate-200 bg-white shadow-xl">
            <SidebarNav
              onNavigate={() => setIsMobileMenuOpen(false)}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menu de navegação"
              aria-expanded={isMobileMenuOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              {sectionTitle}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="max-w-[200px] truncate text-sm font-medium text-slate-900">
                {user.name}
              </p>
              <div className="mt-0.5 flex items-center justify-end gap-1.5">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${roleBadgeClass}`}
                >
                  {roleLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:hidden">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${roleBadgeClass}`}
              >
                {roleLabel}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-200" aria-hidden="true" />

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-[background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              )}
              <span>{isLoggingOut ? "Saindo..." : "Sair"}</span>
            </button>
          </div>
        </header>

        <main
          id="conteudo-principal"
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <div className="mb-4 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-900/[0.06] sm:hidden">
            <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
