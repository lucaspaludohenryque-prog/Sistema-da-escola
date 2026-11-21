"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { ROLE_BADGE_STYLES, ROLE_LABELS } from "@/features/auth/constants";
import { getDefaultDashboardPath, type PublicUser } from "@/features/auth/types";
import { JUSTIFICATIONS_UPDATED_EVENT } from "@/features/justifications/types";
import { MESSAGES_UPDATED_EVENT } from "@/features/messages/types";
import { NOTIFICATIONS_UPDATED_EVENT } from "@/features/notifications/constants";
import { buildSchoolThemeStyle } from "@/features/school-config/constants";
import type { SchoolConfigData } from "@/features/school-config/types";
import { Avatar } from "@/shared/components/Avatar";
import { InstallAppBanner } from "@/shared/components/InstallAppBanner";
import { useTheme } from "@/shared/components/ThemeProvider";
import {
  resolveDashboardBreadcrumb,
  resolveDashboardSectionTitle,
} from "../constants";
import { CommandPalette } from "./CommandPalette";
import { MobileBottomNav } from "./MobileBottomNav";
import { SidebarNav } from "./SidebarNav";

interface DashboardShellProps {
  user: PublicUser;
  schoolConfig: SchoolConfigData;
  initialUnacknowledgedCount: number;
  initialPendingJustificationsCount?: number;
  initialUnreadMessagesCount?: number;
  children: React.ReactNode;
}

const SIDEBAR_STORAGE_KEY = "rco-sidebar-collapsed";

export function DashboardShell({
  user,
  schoolConfig,
  initialUnacknowledgedCount,
  initialPendingJustificationsCount = 0,
  initialUnreadMessagesCount = 0,
  children,
}: DashboardShellProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, mounted, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(
    initialUnacknowledgedCount
  );
  const [pendingJustificationsCount, setPendingJustificationsCount] = useState(
    initialPendingJustificationsCount
  );
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(
    initialUnreadMessagesCount
  );
  const userMenuRef = useRef<HTMLDivElement>(null);

  const sectionTitle = resolveDashboardSectionTitle(pathname);
  const breadcrumb = resolveDashboardBreadcrumb(pathname, user.role);
  const homeHref = getDefaultDashboardPath(user.role);
  const roleLabel = ROLE_LABELS[user.role];
  const roleBadgeClass = ROLE_BADGE_STYLES[user.role];
  const showNotificationBell =
    user.role === "RESPONSAVEL" || user.role === "ALUNO";
  const themeStyle = buildSchoolThemeStyle(
    schoolConfig.primaryColor
  ) as CSSProperties;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === "1") {
        setIsSidebarCollapsed(true);
      }
    } catch {
      // Ignora erro caso localStorage esteja bloqueado.
    }
  }, []);

  function handleToggleSidebarCollapse(): void {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignora erro de persistencia.
      }
      return next;
    });
  }

  useEffect(() => {
    setUnacknowledgedCount(initialUnacknowledgedCount);
  }, [initialUnacknowledgedCount]);

  useEffect(() => {
    setPendingJustificationsCount(initialPendingJustificationsCount);
  }, [initialPendingJustificationsCount]);

  useEffect(() => {
    setUnreadMessagesCount(initialUnreadMessagesCount);
  }, [initialUnreadMessagesCount]);

  useEffect(() => {
    function handleMessagesUpdated(event: Event): void {
      const customEvent = event as CustomEvent<{ unreadThreadsCount: number }>;
      if (typeof customEvent.detail?.unreadThreadsCount === "number") {
        setUnreadMessagesCount(customEvent.detail.unreadThreadsCount);
      }
    }

    window.addEventListener(MESSAGES_UPDATED_EVENT, handleMessagesUpdated);
    return () =>
      window.removeEventListener(MESSAGES_UPDATED_EVENT, handleMessagesUpdated);
  }, []);

  useEffect(() => {
    function handleJustificationsUpdated(event: Event): void {
      const customEvent = event as CustomEvent<{ pendingCount: number }>;
      if (typeof customEvent.detail?.pendingCount === "number") {
        setPendingJustificationsCount(customEvent.detail.pendingCount);
      }
    }

    window.addEventListener(
      JUSTIFICATIONS_UPDATED_EVENT,
      handleJustificationsUpdated
    );
    return () =>
      window.removeEventListener(
        JUSTIFICATIONS_UPDATED_EVENT,
        handleJustificationsUpdated
      );
  }, []);

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

    window.addEventListener(
      NOTIFICATIONS_UPDATED_EVENT,
      handleNotificationsUpdated
    );
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

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent): void {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserMenuOpen]);

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
      className="flex min-h-[100dvh] bg-[#F7F7F8] text-zinc-900 transition-colors duration-150 dark:bg-[#0C0D0F] dark:text-zinc-100 print:block print:min-h-0 print:bg-white print:text-zinc-900"
    >
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-[var(--school-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white print:hidden"
      >
        Ir para o conteúdo principal
      </a>

      {/* Sidebar fixa e colapsavel no desktop */}
      <aside
        className={`hidden shrink-0 border-r border-zinc-200/80 bg-white transition-[width] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] lg:fixed lg:inset-y-0 lg:left-0 lg:block dark:border-white/[0.08] dark:bg-[#131518] print:hidden ${
          isSidebarCollapsed ? "lg:w-16" : "lg:w-60"
        }`}
      >
        <SidebarNav
          userRole={user.role}
          schoolConfig={schoolConfig}
          unacknowledgedCount={unacknowledgedCount}
          pendingJustificationsCount={pendingJustificationsCount}
          unreadMessagesCount={unreadMessagesCount}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
        />
      </aside>

      {/* Drawer lateral responsivo no mobile */}
      {isMobileMenuOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[84vw] border-r border-zinc-200/80 bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#131518]">
            <SidebarNav
              userRole={user.role}
              schoolConfig={schoolConfig}
              unacknowledgedCount={unacknowledgedCount}
              pendingJustificationsCount={pendingJustificationsCount}
              unreadMessagesCount={unreadMessagesCount}
              onNavigate={() => setIsMobileMenuOpen(false)}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div
        className={`flex min-w-0 flex-1 flex-col transition-[padding-left] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] print:pl-0 ${
          isSidebarCollapsed ? "lg:pl-16" : "lg:pl-60"
        }`}
      >
        {/* Cabecalho compacto e limpo */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/95 px-4 sm:px-6 lg:px-8 dark:border-white/[0.08] dark:bg-[#131518]/95 print:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menu de navegação"
              aria-expanded={isMobileMenuOpen}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 lg:hidden dark:text-zinc-400 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-100"
            >
              <Menu className="h-4 w-4" strokeWidth={1.75} />
            </button>

            <div className="flex min-w-0 items-center gap-1.5">
              {breadcrumb.parent !== sectionTitle ? (
                <>
                  <Link
                    href={homeHref}
                    className="hidden truncate text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-700 sm:inline dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    {breadcrumb.parent}
                  </Link>
                  <ChevronRight
                    className="hidden h-3.5 w-3.5 shrink-0 text-zinc-300 sm:inline dark:text-zinc-600"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </>
              ) : null}
              <h1 className="truncate text-sm font-semibold tracking-[-0.02em] text-zinc-900 sm:text-[15px] dark:text-zinc-100">
                {sectionTitle}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Busca Global Ctrl+K */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Abrir busca rápida (Ctrl+K)"
              className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200/90 bg-zinc-50 px-2.5 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-800 dark:border-white/[0.08] dark:bg-[#1A1D21] dark:text-zinc-400 dark:hover:border-white/[0.14] dark:hover:text-zinc-200"
            >
              <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden md:inline">Buscar...</span>
              <kbd className="hidden rounded border border-zinc-200/90 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-500 sm:inline-block dark:border-white/[0.08] dark:bg-[#131518] dark:text-zinc-400">
                Ctrl K
              </kbd>
            </button>

            {/* Alternador Dark Mode */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              title={isDark ? "Modo Claro" : "Modo Escuro"}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200/90 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-[#1A1D21] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100"
            >
              {isDark ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>

            {/* Sininho de Notificacoes */}
            {showNotificationBell ? (
              <Link
                href="/dashboard/avisos"
                aria-label={
                  unacknowledgedCount > 0
                    ? `Avisos (${unacknowledgedCount} aguardando confirmação)`
                    : "Avisos"
                }
                className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200/90 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-[#1A1D21] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100"
              >
                <Bell className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {unacknowledgedCount > 0 ? (
                  <span className="absolute -top-1 -right-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold tabular-nums text-white ring-2 ring-white dark:ring-[#131518]">
                    {unacknowledgedCount > 99 ? "99+" : unacknowledgedCount}
                  </span>
                ) : null}
              </Link>
            ) : null}

            {/* Avatar com Dropdown (Perfil / Tema / Sair) */}
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                aria-label="Menu da conta do usuário"
                className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200/90 bg-white pr-2 pl-1 transition-colors hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-[#1A1D21] dark:hover:bg-white/[0.07]"
              >
                <Avatar name={user.name} size="xs" />
                <span className="hidden max-w-[128px] truncate text-xs font-medium text-zinc-800 sm:inline dark:text-zinc-200">
                  {user.name}
                </span>
                <ChevronDown
                  className={`hidden h-3.5 w-3.5 text-zinc-400 transition-transform duration-150 sm:block dark:text-zinc-500 ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </button>

              {isUserMenuOpen ? (
                <div
                  role="menu"
                  aria-label="Opções do usuário"
                  className="absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[var(--shadow-popover)] dark:border-white/10 dark:bg-[#131518]"
                >
                  <div className="border-b border-zinc-100 px-3.5 py-3 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={user.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`mt-2.5 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${roleBadgeClass}`}
                    >
                      {roleLabel}
                    </span>
                  </div>

                  <div className="p-1">
                    <Link
                      href={homeHref}
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-100"
                    >
                      <UserIcon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
                      <span>Meu Painel</span>
                    </Link>

                    {user.role === "ADMIN" ? (
                      <Link
                        href="/dashboard/configuracoes"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-100"
                      >
                        <Settings className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
                        <span>Configurações da Escola</span>
                      </Link>
                    ) : null}

                    <Link
                      href="/dashboard/ajuda"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-100"
                    >
                      <HelpCircle className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
                      <span>Central de Ajuda</span>
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        toggleTheme();
                        setIsUserMenuOpen(false);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-100"
                    >
                      {isDark ? (
                        <Sun className="h-4 w-4 text-zinc-400 dark:text-zinc-400" strokeWidth={1.75} aria-hidden="true" />
                      ) : (
                        <Moon className="h-4 w-4 text-zinc-400" strokeWidth={1.75} aria-hidden="true" />
                      )}
                      <span>{isDark ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}</span>
                    </button>
                  </div>

                  <div className="border-t border-zinc-100 p-1 dark:border-white/[0.06]">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                      ) : (
                        <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      )}
                      <span>{isLoggingOut ? "Encerrando sessão..." : "Sair do sistema"}</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main
          id="conteudo-principal"
          className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-20 sm:px-6 md:pb-8 lg:px-8 lg:pt-7 print:max-w-none print:p-0"
        >
          <InstallAppBanner />
          {children}
        </main>
      </div>

      {/* Bottom Navigation Bar nativa para celular */}
      <MobileBottomNav
        userRole={user.role}
        unacknowledgedCount={unacknowledgedCount}
        pendingJustificationsCount={pendingJustificationsCount}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
      />

      <CommandPalette
        isOpen={isSearchOpen}
        userRole={user.role}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
