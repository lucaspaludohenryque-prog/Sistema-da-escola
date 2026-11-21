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
  unreadMessagesCount?: number;
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
  unreadMessagesCount = 0,
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
    <div className="flex h-full flex-col bg-white dark:bg-[#131518]">
      {/* Topo da sidebar alinhado com a altura compacta do header */}
      <div
        className={`flex h-14 shrink-0 items-center border-b border-zinc-200/80 dark:border-white/[0.08] ${
          collapsed ? "justify-center px-2" : "justify-between px-3.5"
        }`}
      >
        <Link
          href={homeHref}
          onClick={onNavigate}
          title={collapsed ? schoolConfig.name : undefined}
          className={`flex min-w-0 items-center rounded-lg py-1 focus-visible:outline-none ${
            collapsed ? "justify-center" : "gap-2.5"
          }`}
        >
          {schoolConfig.logoUrl ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 p-1 ring-1 ring-zinc-200/80 dark:bg-[#1A1D21] dark:ring-white/[0.08]">
              <img
                src={schoolConfig.logoUrl}
                alt={`Logo ${schoolConfig.name}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--school-primary)] text-white">
              <BookOpenCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </div>
          )}
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
                {schoolConfig.name}
              </p>
              <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
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
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 lg:hidden dark:text-zinc-400 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-100"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : onToggleCollapse && !collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Recolher barra lateral"
            title="Recolher menu"
            className="hidden h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 lg:flex dark:text-zinc-500 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-200"
          >
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* Lista de secoes com rolagem vertical discreta */}
      <nav
        aria-label="Navegação principal"
        className={`rco-thin-scrollbar flex-1 overflow-y-auto py-3 ${
          collapsed ? "px-2" : "px-2.5"
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
                      className="mx-auto my-2.5 h-px w-7 bg-zinc-200/80 dark:bg-white/[0.08]"
                      aria-hidden="true"
                    />
                  ) : null
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleSection(group.section)}
                    aria-expanded={!isSectionCollapsed}
                    className="mb-1 flex w-full cursor-pointer items-center justify-between px-2.5 py-1 text-[11px] font-medium tracking-wider text-zinc-400 uppercase transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    <span>{group.section}</span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-150 ${
                        isSectionCollapsed ? "-rotate-90" : ""
                      }`}
                      strokeWidth={1.75}
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
                            : item.showMessagesBadge && unreadMessagesCount > 0
                              ? unreadMessagesCount
                              : 0;

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={onNavigate}
                            aria-current={isActive ? "page" : undefined}
                            title={collapsed ? item.label : undefined}
                            className={`group relative flex items-center rounded-lg text-[13px] transition-colors duration-150 ${
                              collapsed
                                ? "mx-auto h-9 w-9 justify-center p-0"
                                : "gap-2.5 px-2.5 py-2"
                            } ${
                              isActive
                                ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-white/[0.07] dark:text-zinc-100"
                                : "font-normal text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-100"
                            }`}
                          >
                            {isActive && !collapsed ? (
                              <span
                                aria-hidden="true"
                                className="absolute top-1.5 bottom-1.5 left-0 w-[2.5px] rounded-full bg-[var(--school-primary)]"
                              />
                            ) : null}

                            <Icon
                              className={`h-4 w-4 shrink-0 transition-colors ${
                                isActive
                                  ? "text-[var(--school-primary)]"
                                  : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                              }`}
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />

                            {!collapsed ? (
                              <>
                                <span className="truncate">{item.label}</span>
                                {badgeValue > 0 ? (
                                  <span className="ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
                                    {badgeValue > 99 ? "99+" : badgeValue}
                                  </span>
                                ) : null}
                              </>
                            ) : badgeValue > 0 ? (
                              <span
                                aria-label={`${badgeValue} pendentes`}
                                className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold tabular-nums text-white ring-2 ring-white dark:ring-[#131518]"
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

      {/* Rodape discreto da sidebar / botao expandir quando compacta */}
      <div
        className={`shrink-0 border-t border-zinc-200/80 dark:border-white/[0.08] ${
          collapsed ? "flex justify-center p-2" : "px-4 py-3"
        }`}
      >
        {collapsed && onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expandir barra lateral"
            title="Expandir menu"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-100"
          >
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        ) : (
          <div>
            <p className="text-[11px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
              Ano letivo {schoolConfig.schoolYear}
            </p>
            {schoolConfig.city ? (
              <p className="mt-0.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                {schoolConfig.city}
                {schoolConfig.state ? ` - ${schoolConfig.state}` : ""}
              </p>
            ) : (
              <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                RCO · Gestão Escolar
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
