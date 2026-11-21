/* eslint-disable @next/next/no-img-element -- Exibe brasao/logo da escola em Base64 ou URL configuravel. */

import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpenCheck, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import {
  buildSchoolThemeStyle,
  getDefaultSchoolConfig,
  getSchoolConfig,
} from "@/features/school-config";
import { ThemeToggleButton } from "@/shared/components/ThemeToggleButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar no Sistema",
  description: "Autenticação segura no Registro de Classe Online.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<React.JSX.Element> {
  const [params, schoolConfig] = await Promise.all([
    searchParams,
    getSchoolConfig().catch(() => getDefaultSchoolConfig()),
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
      className="grid min-h-[100dvh] grid-cols-1 bg-white text-zinc-900 lg:grid-cols-[440px_1fr] dark:bg-[#0C0D0F] dark:text-zinc-100"
    >
      {/* Coluna esquerda institucional sobria (desktop) */}
      <aside className="relative hidden flex-col justify-between border-r border-zinc-200/80 bg-zinc-100/80 lg:flex dark:border-white/[0.08] dark:bg-[#131518]">
        {/* Fina faixa institucional superior de 3px */}
        <div
          aria-hidden="true"
          className="h-[3px] w-full shrink-0 bg-[var(--school-primary)]"
        />

        <div className="flex flex-1 flex-col justify-between px-10 py-10">
          {/* Identidade institucional */}
          <div className="flex items-center gap-3.5">
            {schoolConfig.logoUrl ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5 ring-1 ring-zinc-200/90 dark:bg-[#1A1D21] dark:ring-white/[0.08]">
                <img
                  src={schoolConfig.logoUrl}
                  alt={`Brasão ${schoolConfig.name}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--school-primary)] text-white">
                <BookOpenCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
                {schoolConfig.name}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {locationLine ? locationLine : "Registro de Classe Online"}
              </p>
            </div>
          </div>

          {/* Nota institucional calma e objetiva */}
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-wider text-zinc-400 uppercase tabular-nums dark:text-zinc-500">
              Ano letivo {schoolConfig.schoolYear}
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
              Registro de Classe Online
            </h1>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Acesso restrito a docentes, equipe pedagógica, estudantes e responsáveis
              legais. Os registros de frequência, notas e comunicados seguem o calendário
              oficial da instituição.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
              <ShieldCheck
                className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Sessão protegida com credenciais individuais.</span>
            </div>
          </div>

          {/* Rodape da coluna com link discreto para validacao e documentos legais */}
          <div className="space-y-3 border-t border-zinc-200/80 pt-5 dark:border-white/[0.08]">
            <Link
              href="/validar"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <span>Validar documento emitido</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <Link
                href="/termos"
                className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Termos de Uso
              </Link>
              <Link
                href="/privacidade"
                className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Privacidade (LGPD)
              </Link>
              <Link
                href="/cookies"
                className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Coluna direita focada no formulario */}
      <main className="flex flex-col justify-between bg-white px-4 py-6 sm:px-8 lg:px-12 dark:bg-[#0C0D0F]">
        <div className="mx-auto flex w-full max-w-sm items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>Voltar ao início</span>
          </Link>
          <ThemeToggleButton />
        </div>

        <div className="mx-auto my-10 w-full max-w-sm">
          {/* Identidade compacta apenas no mobile */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            {schoolConfig.logoUrl ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 p-1 ring-1 ring-zinc-200/80 dark:bg-[#1A1D21] dark:ring-white/[0.08]">
                <img
                  src={schoolConfig.logoUrl}
                  alt={`Brasão ${schoolConfig.name}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--school-primary)] text-white">
                <BookOpenCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
                {schoolConfig.name}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Registro de Classe Online
                {locationLine ? ` · ${locationLine}` : ""}
              </p>
            </div>
          </div>

          <section aria-labelledby="login-heading">
            <div className="mb-7 space-y-1.5">
              <h2
                id="login-heading"
                className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 sm:text-2xl dark:text-zinc-100"
              >
                Entrar no sistema
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Use o e-mail e a senha fornecidos pela secretaria.
              </p>
            </div>

            <LoginForm
              redirectTo={params.next}
              demoModeEnabled={schoolConfig.demoModeEnabled}
            />
          </section>

          <div className="mt-6 flex flex-col gap-2 border-t border-zinc-200/70 pt-5 text-xs text-zinc-500 dark:border-white/[0.08] dark:text-zinc-400">
            <p>
              Dúvidas no acesso? Procure a secretaria ou a coordenação da unidade.
            </p>
            <Link
              href="/validar"
              className="inline-flex items-center gap-1 font-medium text-zinc-700 transition-colors hover:text-zinc-900 lg:hidden dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              <span>Validar documento emitido</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-col gap-2 text-xs text-zinc-400 tabular-nums dark:text-zinc-500">
          <p>
            {schoolConfig.name} · Ano letivo {schoolConfig.schoolYear}
          </p>
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] lg:hidden">
            <Link
              href="/termos"
              className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Termos de Uso
            </Link>
            <Link
              href="/privacidade"
              className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Privacidade (LGPD)
            </Link>
            <Link
              href="/cookies"
              className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Cookies
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
