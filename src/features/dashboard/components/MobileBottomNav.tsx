"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { UserRole } from "@/features/auth/types";
import { getMobileBottomNavItems } from "../constants";

interface MobileBottomNavProps {
  userRole: UserRole;
  unacknowledgedCount: number;
  pendingJustificationsCount: number;
  onOpenMenu: () => void;
}

export function MobileBottomNav({
  userRole,
  unacknowledgedCount,
  pendingJustificationsCount,
  onOpenMenu,
}: MobileBottomNavProps): React.JSX.Element {
  const pathname = usePathname();
  const items = getMobileBottomNavItems(userRole);

  return (
    <nav
      aria-label="Atalhos rápidos mobile"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/85 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden dark:border-slate-800/90 dark:bg-slate-900/90 print:hidden"
    >
      <div className="grid h-16 grid-cols-5 items-center px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const showBadge =
            item.showNotificationBadge && unacknowledgedCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? "text-[var(--school-primary)] dark:text-blue-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {isActive ? (
                <span
                  aria-hidden="true"
                  className="absolute top-0 h-0.5 w-7 rounded-full bg-[var(--school-primary)] dark:bg-blue-400"
                />
              ) : null}
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.1 : 1.75} aria-hidden="true" />
                {showBadge ? (
                  <span className="absolute -top-1.5 -right-2 inline-flex min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    {unacknowledgedCount > 9 ? "9+" : unacknowledgedCount}
                  </span>
                ) : null}
              </span>
              <span className="max-w-full truncate px-0.5 leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menu completo"
          className="relative flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <span className="relative">
            <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            {pendingJustificationsCount > 0 ? (
              <span className="absolute -top-1 -right-1.5 inline-flex h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900" />
            ) : null}
          </span>
          <span className="leading-none">Menu</span>
        </button>
      </div>
    </nav>
  );
}
