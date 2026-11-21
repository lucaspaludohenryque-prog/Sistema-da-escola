/* eslint-disable @next/next/no-img-element -- Exibe brasao/logo da escola em Base64 ou URL configuravel. */

import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { BookOpenCheck, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { buildSchoolThemeStyle, getSchoolConfig } from "@/features/school-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acesso ao Sistema",
  description: "Autenticação segura no Registro de Classe Online.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

const SYSTEM_PILLARS = [
  {
    title: "Registro diário sem travamentos",
    description: "Chamada, ocorrências e lançamento de notas centralizados em fluxo rápido.",
  },
  {
    title: "Sessão protegida por perfil",
    description:
      "Controle de acesso separado para Professores, Coordenação, Administração e Família.",
  },
];

export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<React.JSX.Element> {
  const [params, schoolConfig] = await Promise.all([
    searchParams,
    getSchoolConfig(),
  ]);

  const locationLine = [schoolConfig.city, schoolConfig.state]
    .filter((part) => part.trim().length > 0)
    .join(" - ");

  const themeStyle = buildSchoolThemeStyle(
    schoolConfig.primaryColor
  ) as CSSProperties;

  return (
    <div
      style={themeStyle}
      className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[1.08fr_1fr]"
    >
      <aside className="rco-grid-pattern relative hidden flex-col justify-between bg-[#0F172A] px-12 py-12 text-slate-100 lg:flex">
        <div className="flex items-center gap-3.5">
          {schoolConfig.logoUrl ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-white/20">
              <img
                src={schoolConfig.logoUrl}
                alt={`Logo ${schoolConfig.name}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--school-primary)] text-white ring-1 ring-white/15">
              <BookOpenCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-white">
              {schoolConfig.name}
            </p>
            <p className="truncate text-xs text-slate-400">
              Registro de Classe Online
              {locationLine ? ` · ${locationLine}` : ""}
            </p>
          </div>
        </div>

        <div className="max-w-lg space-y-8">
          <div className="space-y-4">
            <div
              className="h-1 w-12 rounded-full bg-[var(--school-primary)]"
              aria-hidden="true"
            />
            <h1 className="text-3xl font-semibold tracking-tight text-white xl:text-4xl xl:leading-[1.15]">
              Gestão acadêmica clara, estável e pronta para a rotina escolar.
            </h1>
            <p className="text-sm leading-relaxed text-slate-300">
              Acesse o ambiente pedagógico para acompanhar turmas, registrar frequência diária,
              documentar ocorrências e consolidar avaliações com rastreabilidade.
            </p>
          </div>

          <div className="space-y-4 border-t border-slate-800 pt-6">
            {SYSTEM_PILLARS.map((pillar) => (
              <div key={pillar.title} className="space-y-1">
                <p className="text-sm font-medium text-white">{pillar.title}</p>
                <p className="text-sm leading-relaxed text-slate-400">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-blue-400" strokeWidth={1.75} aria-hidden="true" />
          <span>
            Ano letivo {schoolConfig.schoolYear} · Autenticação protegida por cookie HTTP-only.
          </span>
        </div>
      </aside>

      <main className="flex flex-col justify-center bg-[#F6F8FA] px-4 py-10 sm:px-8 lg:px-14 dark:bg-slate-950">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            {schoolConfig.logoUrl ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-slate-200 dark:ring-slate-700">
                <img
                  src={schoolConfig.logoUrl}
                  alt={`Logo ${schoolConfig.name}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--school-primary)] text-white">
                <BookOpenCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {schoolConfig.name}
              </p>
              <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                Registro de Classe Online
                {locationLine ? ` · ${locationLine}` : ""}
              </p>
            </div>
          </div>

          <section
            aria-labelledby="login-heading"
            className="rounded-2xl bg-white p-6 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-8 dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="mb-6 space-y-1.5">
              <h2
                id="login-heading"
                className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
              >
                Acessar conta
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Informe seu e-mail institucional e senha para continuar.
              </p>
            </div>

            <LoginForm redirectTo={params.next} />
          </section>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Em caso de dificuldade no acesso, contate a secretaria ou coordenação da unidade.
          </p>
        </div>
      </main>
    </div>
  );
}
