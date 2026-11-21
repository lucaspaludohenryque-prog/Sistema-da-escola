"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { ROLE_BADGE_STYLES, ROLE_LABELS } from "@/features/auth/constants";
import type { PublicUser } from "@/features/auth/types";
import { NOTIFICATIONS_UPDATED_EVENT } from "@/features/notifications/constants";
import { buildSchoolThemeStyle } from "@/features/school-config/constants";
import type { SchoolConfigData } from "@/features/school-config/types";
import { Avatar } from "@/shared/components/Avatar";
import { useTheme } from "@/shared/components/ThemeProvider";
import { resolveDashboardSectionTitle } from "../constants";
import { CommandPalette } from "./CommandPalette";
import { SidebarNav } from "./SidebarNav";

interface DashboardShellProps {
  user: PublicUser;
  schoolConfig: SchoolConfigData;
  initialUnacknowledgedCount: number;
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  schoolConfig,
  initialUnacknowledgedCount,
  children,
}: DashboardShellProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, mounted, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(
    initialUnacknowledgedCount
  );

  const sectionTitle = resolveDashboardSectionTitle(pathname);
  const roleLabel = ROLE_LABELS[user.role];
  const roleBadgeClass = ROLE_BADGE_STYLES[user.role];
  const showNotificationBell =
    user.role === "RESPONSAVEL" || user.role === "ALUNO";
  const themeStyle = buildSchoolThemeStyle(
    schoolConfig.primaryColor
  ) as CSSProperties;

  useEffect(() => {
    setUnacknowledgedCount(initialUnacknowledgedCount);
  }, [initialUnacknowledgedCount]);

  useEffect(() => {
    if (!showNotificationBell) {
      return;
    }

    function handleNotificationsUpdated(event: Event): void {
      const customEvent = event as CustomEvent<{ unacknowledgedCount: number }>;
      if (typeof customEvent.detail?.unacknowledgedCount === "number") {
        setUnacknowledgedCount(customEvent.detail.unacknowledgedCount);
      }
    }

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);
    return () =>
      window.removeEventListener(
        NOTIFICATIONS_UPDATED_EVENT,
        handleNotificationsUpdated
      );
  }, [showNotificationBell]);

  useEffect(() => {
    function handleGlobalShortcuts(event: KeyboardEvent): void {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

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

  const isDark = mounted && theme === "dark";

  return (
    <div
      style={themeStyle}
      className="flex min-h-[100dvh] bg-[#F6F8FA] text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 print:block print:min-h-0 print:bg-white print:text-slate-900"
    >
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-[var(--school-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white print:hidden"
      >
        Ir para o conteúdo principal
      </a>

      {/* Sidebar fixa no desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:block dark:border-slate-800 dark:bg-slate-900 print:hidden">
        <SidebarNav
          userRole={user.role}
          schoolConfig={schoolConfig}
          unacknowledgedCount={unacknowledgedCount}
        />
      </aside>

      {/* Drawer lateral responsivo no mobile */}
      {isMobileMenuOpen ? (
        <div
          className="fixed inset-0 z-40 lg:hidden print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[82vw] border-r border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <SidebarNav
              userRole={user.role}
              schoolConfig={schoolConfig}
              unacknowledgedCount={unacknowledgedCount}
              onNavigate={() => setIsMobileMenuOpen(false)}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/95 print:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menu de navegação"
              aria-expanded={isMobileMenuOpen}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg dark:text-slate-100">
              {sectionTitle}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Gatilho discreto de busca global Ctrl+K */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Abrir busca rápida (Ctrl+K)"
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/90 px-2.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 sm:px-3 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <Search className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden md:inline">Busca rápida...</span>
              <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 sm:inline-block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                Ctrl + K
              </kbd>
            </button>

            {/* Alternador Modo Claro / Escuro */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              title={isDark ? "Modo Claro" : "Modo Escuro"}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700"
            >
              {isDark ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>

            {showNotificationBell ? (
              <Link
                href="/dashboard/avisos"
                aria-label={
                  unacknowledgedCount > 0
                    ? `Avisos (${unacknowledgedCount} aguardando confirmação)`
                    : "Avisos"
                }
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 hover:text-[var(--school-primary)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Bell className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {unacknowledgedCount > 0 ? (
                  <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    {unacknowledgedCount > 99 ? "99+" : unacknowledgedCount}
                  </span>
                ) : null}
              </Link>
            ) : null}

            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="text-right">
                <p className="max-w-[170px] truncate text-sm font-medium text-slate-900 dark:text-slate-100">
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
              <Avatar name={user.name} size="md" />
            </div>

            <div className="flex items-center gap-1.5 sm:hidden">
              <Avatar name={user.name} size="sm" />
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-[background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {isLoggingOut ? "Saindo..." : "Sair"}
              </span>
            </button>
          </div>
        </header>

        <main
          id="conteudo-principal"
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:max-w-none print:p-0"
        >
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-900/[0.06] sm:hidden dark:bg-slate-900 dark:ring-slate-800 print:hidden">
            <Avatar name={user.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${roleBadgeClass}`}
            >
              {roleLabel}
            </span>
          </div>
          {children}
        </main>
      </div>

      <CommandPalette
        isOpen={isSearchOpen}
        userRole={user.role}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
