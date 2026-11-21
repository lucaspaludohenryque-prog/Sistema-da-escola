"use client";
/* eslint-disable @next/next/no-img-element -- Exibe logo da escola em Base64 ou URL configuravel. */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, X } from "lucide-react";
import { getDefaultDashboardPath, type UserRole } from "@/features/auth/types";
import type { SchoolConfigData } from "@/features/school-config/types";
import { getDashboardNavItems } from "../constants";

interface SidebarNavProps {
  userRole: UserRole;
  schoolConfig: SchoolConfigData;
  unacknowledgedCount: number;
  pendingJustificationsCount?: number;
  onNavigate?: () => void;
  onCloseMobile?: () => void;
}

export function SidebarNav({
  userRole,
  schoolConfig,
  unacknowledgedCount,
  pendingJustificationsCount = 0,
  onNavigate,
  onCloseMobile,
}: SidebarNavProps): React.JSX.Element {
  const pathname = usePathname();
  const visibleItems = getDashboardNavItems(userRole);
  const homeHref = getDefaultDashboardPath(userRole);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4 dark:border-slate-800">
        <Link
          href={homeHref}
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3 rounded-lg py-1 focus-visible:outline-none"
        >
          {schoolConfig.logoUrl ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-1 ring-1 ring-slate-200 dark:bg-white dark:ring-slate-700">
              <img
                src={schoolConfig.logoUrl}
                alt={`Logo ${schoolConfig.name}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--school-primary)] text-white shadow-xs">
              <BookOpenCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {schoolConfig.name}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {userRole === "RESPONSAVEL"
                ? "Portal da Família"
                : userRole === "ALUNO"
                  ? "Portal do Aluno"
                  : "Registro de Classe"}
            </p>
          </div>
        </Link>

        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Fechar menu de navegação"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>

      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const hasHash = item.href.includes("#");
            const isActive = hasHash
              ? false
              : item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  style={
                    isActive
                      ? { backgroundColor: "var(--school-primary-soft)" }
                      : undefined
                  }
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "text-[var(--school-primary)] dark:text-blue-300"
                      : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                      isActive
                        ? "text-[var(--school-primary)] dark:text-blue-300"
                        : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
                    }`}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                  {item.showNotificationBadge && unacknowledgedCount > 0 ? (
                    <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
                      {unacknowledgedCount > 99 ? "99+" : unacknowledgedCount}
                    </span>
                  ) : item.showJustificationsBadge && pendingJustificationsCount > 0 ? (
                    <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
                      {pendingJustificationsCount > 99
                        ? "99+"
                        : pendingJustificationsCount}
                    </span>
                  ) : isActive ? (
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--school-primary)] dark:bg-blue-400"
                      aria-hidden="true"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200/80 px-5 py-4 dark:border-slate-800">
        <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
          Ano letivo {schoolConfig.schoolYear}
        </p>
        {schoolConfig.city ? (
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {schoolConfig.city}
            {schoolConfig.state ? ` - ${schoolConfig.state}` : ""}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            RCO · Gestão Escolar
          </p>
        )}
      </div>
    </div>
  );
}
