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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] md:hidden dark:border-white/[0.08] dark:bg-[#131518]/95 print:hidden"
    >
      <div className="grid h-14 grid-cols-5 items-center px-1">
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
              className={`relative flex flex-col items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-[var(--school-primary)]"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {isActive ? (
                <span
                  aria-hidden="true"
                  className="absolute top-0 h-0.5 w-6 rounded-full bg-[var(--school-primary)]"
                />
              ) : null}
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                {showBadge ? (
                  <span className="absolute -top-1 -right-2 inline-flex min-w-[15px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold tabular-nums text-white ring-2 ring-white dark:ring-[#131518]">
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
          className="relative flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <span className="relative">
            <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            {pendingJustificationsCount > 0 ? (
              <span className="absolute -top-0.5 -right-1 inline-flex h-2 w-2 rounded-full bg-red-600 ring-2 ring-white dark:ring-[#131518]" />
            ) : null}
          </span>
          <span className="leading-none">Menu</span>
        </button>
      </div>
    </nav>
  );
}
