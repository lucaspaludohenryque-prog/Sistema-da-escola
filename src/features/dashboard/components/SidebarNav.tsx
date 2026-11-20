"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, X } from "lucide-react";
import { DASHBOARD_NAV_ITEMS } from "../constants";

interface SidebarNavProps {
  onNavigate?: () => void;
  onCloseMobile?: () => void;
}

export function SidebarNav({
  onNavigate,
  onCloseMobile,
}: SidebarNavProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg py-1 focus-visible:outline-none"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1E40AF] text-white">
            <BookOpenCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-900">
              RCO Escolar
            </p>
            <p className="truncate text-xs text-slate-500">Registro de Classe</p>
          </div>
        </Link>

        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Fechar menu de navegação"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>

      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-blue-50 text-[#1E40AF]"
                      : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                      isActive
                        ? "text-[#1E40AF]"
                        : "text-slate-500 group-hover:text-slate-700"
                    }`}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                  {isActive ? (
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-[#1E40AF]"
                      aria-hidden="true"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200/80 px-5 py-4">
        <p className="font-mono text-[11px] text-slate-500">RCO · Gestão Escolar</p>
        <p className="mt-0.5 text-xs text-slate-500">Ano letivo ativo</p>
      </div>
    </div>
  );
}
