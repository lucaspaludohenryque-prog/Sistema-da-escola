/* eslint-disable @next/next/no-img-element -- Exibe brasao/logo da escola em Base64 ou URL configuravel. */

import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  BookOpenCheck,
  ClipboardCheck,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import {
  buildSchoolThemeStyle,
  getDefaultSchoolConfig,
  getSchoolConfig,
} from "@/features/school-config";
import { ThemeToggleButton } from "@/shared/components/ThemeToggleButton";

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
    title: "Diário Digital",
    description:
      "Chamada diária, conteúdo de aula e planejamento integrados em fluxo ágil.",
    icon: ClipboardCheck,
  },
  {
    title: "Alertas em Tempo Real",
    description:
      "Faltas, ocorrências e comunicados entregues às famílias com registro de ciência.",
    icon: BellRing,
  },
  {
    title: "Boletim Oficial",
    description:
      "Médias trimestrais, recuperação paralela e ficha individual em PDF com QR Code.",
    icon: FileCheck2,
  },
];

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
      className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[1.12fr_1fr]"
    >
      {/* Painel esquerdo imersivo (desktop) */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden px-12 py-11 text-white lg:flex"
        style={{
          background:
            "linear-gradient(150deg, var(--school-primary) 0%, var(--school-primary-hover) 52%, #0b1120 100%)",
        }}
      >
        {/* Padrao geometrico sutil em SVG */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="login-geo-grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="white"
                strokeWidth="0.8"
              />
              <circle cx="48" cy="48" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-geo-grid)" />
          <circle
            cx="88%"
            cy="14%"
            r="220"
            fill="none"
            stroke="white"
            strokeWidth="1"
            strokeOpacity="0.45"
          />
          <circle
            cx="88%"
            cy="14%"
            r="310"
            fill="none"
            stroke="white"
            strokeWidth="0.75"
            strokeOpacity="0.25"
          />
        </svg>

        <div className="relative z-10 flex items-center gap-4">
          {schoolConfig.logoUrl ? (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/95 p-2 shadow-lg ring-1 ring-white/30">
              <img
                src={schoolConfig.logoUrl}
                alt={`Brasão ${schoolConfig.name}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm ring-1 ring-white/25">
              <BookOpenCheck className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-bold tracking-tight text-white">
              {schoolConfig.name}
            </p>
            <p className="truncate text-xs text-white/80">
              Registro de Classe Online
              {locationLine ? ` · ${locationLine}` : ""}
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-8">
          <div className="space-y-3.5">
            <h1 className="text-3xl font-bold tracking-tight text-white xl:text-4xl xl:leading-[1.12]">
              Ecossistema escolar conectado para ensinar, gerir e acompanhar.
            </h1>
            <p className="text-sm leading-relaxed text-white/80">
              Um único ponto de entrada seguro para equipe pedagógica, coordenação,
              responsáveis e estudantes.
            </p>
          </div>

          <div className="space-y-3">
            {SYSTEM_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="flex items-start gap-3.5 rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-xs"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{pillar.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/80">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 text-xs text-white/75">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" strokeWidth={1.75} aria-hidden="true" />
          <span>
            Ano letivo {schoolConfig.schoolYear} · Sessão protegida por cookie HTTP-only.
          </span>
        </div>
      </aside>

      {/* Painel direito com cartao de autenticacao */}
      <main className="relative flex flex-col justify-between bg-[#F6F8FA] px-4 py-6 sm:px-8 lg:px-14 dark:bg-slate-950">
        <div className="mx-auto flex w-full max-w-[440px] items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-[var(--school-primary)] dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>Voltar para a página inicial</span>
          </Link>
          <ThemeToggleButton />
        </div>

        <div className="mx-auto my-8 w-full max-w-[440px]">
          <div className="mb-7 flex items-center gap-3.5 lg:hidden">
            {schoolConfig.logoUrl ? (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700">
                <img
                  src={schoolConfig.logoUrl}
                  alt={`Brasão ${schoolConfig.name}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--school-primary)] text-white shadow-xs">
                <BookOpenCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">
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
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-ambient)] sm:p-8 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-6 space-y-1.5">
              <h2
                id="login-heading"
                className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                Acessar conta
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Informe seu e-mail institucional e senha para entrar no painel.
              </p>
            </div>

            <LoginForm redirectTo={params.next} />
          </section>

          <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
            Dúvidas no acesso? Contate a secretaria ou coordenação da unidade.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[440px] text-center text-[11px] text-slate-400 dark:text-slate-500">
          {schoolConfig.name} · Ano letivo {schoolConfig.schoolYear}
        </div>
      </main>
    </div>
  );
}
