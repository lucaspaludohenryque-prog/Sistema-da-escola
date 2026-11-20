import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ROLE_BADGE_STYLES, ROLE_LABELS, getAuthenticatedUser } from "@/features/auth";
import { DASHBOARD_NAV_ITEMS } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Início",
  description: "Painel principal do Registro de Classe Online.",
};

export default async function DashboardHomePage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const moduleShortcuts = DASHBOARD_NAV_ITEMS.filter((item) => !item.exact);
  const roleLabel = ROLE_LABELS[user.role];
  const roleBadgeClass = ROLE_BADGE_STYLES[user.role];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass}`}
            >
              {roleLabel}
            </span>
            <span className="font-mono text-xs text-slate-500">Sessão autenticada</span>
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            Olá, {user.name}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            A base de autenticação e navegação do Registro de Classe Online está ativa. Selecione um
            dos módulos ao lado ou abaixo para acompanhar a estrutura pedagógica do sistema.
          </p>
        </div>

        <aside className="flex flex-col justify-between rounded-2xl bg-[#0F172A] p-6 text-slate-100 shadow-[var(--shadow-ambient)]">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              <span className="text-xs font-medium">Dados da sessão</span>
            </div>
            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-xs text-slate-400">E-mail</dt>
                <dd className="truncate font-medium text-white">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Perfil de acesso</dt>
                <dd className="font-mono text-xs text-slate-200">{user.role}</dd>
              </div>
            </dl>
          </div>

          <p className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-400">
            Sessão protegida via JWT em cookie HTTP-only com expiração automática.
          </p>
        </aside>
      </section>

      <section aria-labelledby="modulos-heading" className="space-y-3">
        <h3
          id="modulos-heading"
          className="text-sm font-semibold tracking-tight text-slate-800"
        >
          Módulos do Registro de Classe
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {moduleShortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] transition-[box-shadow,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-blue-800/30 active:scale-[0.99]"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E40AF] ring-1 ring-inset ring-blue-100">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-[#1E40AF]">
                      {item.label}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-600">{item.description}</p>
                  </div>
                </div>
                <ArrowRight
                  className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#1E40AF]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
