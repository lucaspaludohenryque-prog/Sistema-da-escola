"use client";
/* eslint-disable @next/next/no-img-element -- Exibe logo da escola em Base64 ou URL configuravel. */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { getDefaultDashboardPath, type UserRole } from "@/features/auth/types";
import type { SchoolConfigData } from "@/features/school-config/types";
import { getDashboardNavGroups, type DashboardNavSection } from "../constants";

interface SidebarNavProps {
  userRole: UserRole;
  schoolConfig: SchoolConfigData;
  unacknowledgedCount: number;
  pendingJustificationsCount?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  onCloseMobile?: () => void;
}

export function SidebarNav({
  userRole,
  schoolConfig,
  unacknowledgedCount,
  pendingJustificationsCount = 0,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  onCloseMobile,
}: SidebarNavProps): React.JSX.Element {
  const pathname = usePathname();
  const navGroups = getDashboardNavGroups(userRole);
  const homeHref = getDefaultDashboardPath(userRole);
  const [collapsedSections, setCollapsedSections] = useState<
    Partial<Record<DashboardNavSection, boolean>>
  >({});

  function toggleSection(section: DashboardNavSection): void {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      {/* Topo da sidebar com brasao e botao de recolher */}
      <div
        className={`flex h-16 shrink-0 items-center border-b border-slate-200/80 dark:border-slate-800 ${
          collapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        <Link
          href={homeHref}
          onClick={onNavigate}
          title={collapsed ? schoolConfig.name : undefined}
          className={`flex min-w-0 items-center rounded-lg py-1 focus-visible:outline-none ${
            collapsed ? "justify-center" : "gap-3"
          }`}
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
          {!collapsed ? (
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
          ) : null}
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
        ) : onToggleCollapse && !collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Recolher barra lateral"
            title="Recolher menu"
            className="hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:flex dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* Lista de secoes com rolagem vertical suave */}
      <nav
        aria-label="Navegação principal"
        className={`rco-thin-scrollbar flex-1 overflow-y-auto py-4 ${
          collapsed ? "px-2" : "px-3"
        }`}
      >
        <div className="space-y-4">
          {navGroups.map((group, groupIndex) => {
            const isSectionCollapsed =
              !collapsed && Boolean(collapsedSections[group.section]);

            return (
              <div key={group.section}>
                {collapsed ? (
                  groupIndex > 0 ? (
                    <div
                      className="mx-auto my-2.5 h-px w-8 bg-slate-200/80 dark:bg-slate-800"
                      aria-hidden="true"
                    />
                  ) : null
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleSection(group.section)}
                    aria-expanded={!isSectionCollapsed}
                    className="mb-1.5 flex w-full cursor-pointer items-center justify-between px-3 py-1 text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    <span>{group.section}</span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-150 ${
                        isSectionCollapsed ? "-rotate-90" : ""
                      }`}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </button>
                )}

                {!isSectionCollapsed ? (
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const hasHash = item.href.includes("#");
                      const isActive = hasHash
                        ? false
                        : item.exact
                          ? pathname === item.href
                          : pathname.startsWith(item.href);

                      const badgeValue =
                        item.showNotificationBadge && unacknowledgedCount > 0
                          ? unacknowledgedCount
                          : item.showJustificationsBadge &&
                              pendingJustificationsCount > 0
                            ? pendingJustificationsCount
                            : 0;

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={onNavigate}
                            aria-current={isActive ? "page" : undefined}
                            title={collapsed ? item.label : undefined}
                            style={
                              isActive
                                ? { backgroundColor: "var(--school-primary-soft)" }
                                : undefined
                            }
                            className={`group relative flex items-center rounded-xl text-sm font-medium transition-colors duration-150 ${
                              collapsed
                                ? "mx-auto h-10 w-10 justify-center p-0"
                                : "gap-3 px-3 py-2"
                            } ${
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

                            {!collapsed ? (
                              <>
                                <span className="truncate">{item.label}</span>
                                {badgeValue > 0 ? (
                                  <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
                                    {badgeValue > 99 ? "99+" : badgeValue}
                                  </span>
                                ) : isActive ? (
                                  <span
                                    className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--school-primary)] dark:bg-blue-400"
                                    aria-hidden="true"
                                  />
                                ) : null}
                              </>
                            ) : badgeValue > 0 ? (
                              <span
                                aria-label={`${badgeValue} pendentes`}
                                className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900"
                              >
                                {badgeValue > 9 ? "9+" : badgeValue}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Rodape da sidebar / botao expandir quando compacta */}
      <div
        className={`shrink-0 border-t border-slate-200/80 dark:border-slate-800 ${
          collapsed ? "flex justify-center p-2.5" : "px-5 py-3.5"
        }`}
      >
        {collapsed && onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expandir barra lateral"
            title="Expandir menu"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        ) : (
          <div>
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
        )}
      </div>
    </div>
  );
}
