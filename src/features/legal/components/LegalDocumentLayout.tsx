/* eslint-disable @next/next/no-img-element -- Exibe brasao da escola em Base64 ou URL configuravel. */

import type { CSSProperties } from "react";
import Link from "next/link";
import { BookOpenCheck, Info } from "lucide-react";
import {
  buildSchoolThemeStyle,
  getDefaultSchoolConfig,
  getSchoolConfig,
} from "@/features/school-config";
import type { SchoolConfigData } from "@/features/school-config/types";
import { ThemeToggleButton } from "@/shared/components/ThemeToggleButton";
import { LegalBackButton } from "./LegalBackButton";

export type LegalPageSlug = "termos" | "privacidade" | "cookies";

interface LegalDocumentLayoutProps {
  activeSlug: LegalPageSlug;
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: (schoolConfig: SchoolConfigData) => React.ReactNode;
}

const LEGAL_NAV_LINKS: ReadonlyArray<{
  slug: LegalPageSlug;
  href: string;
  label: string;
}> = [
  { slug: "termos", href: "/termos", label: "Termos de Uso" },
  { slug: "privacidade", href: "/privacidade", label: "Privacidade (LGPD)" },
  { slug: "cookies", href: "/cookies", label: "Política de Cookies" },
];

export async function LegalDocumentLayout({
  activeSlug,
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalDocumentLayoutProps): Promise<React.JSX.Element> {
  let schoolConfig: SchoolConfigData;
  try {
    schoolConfig = await getSchoolConfig();
  } catch {
    schoolConfig = getDefaultSchoolConfig();
  }

  const themeStyle = buildSchoolThemeStyle(
    schoolConfig.primaryColor
  ) as CSSProperties;

  const locationLine = [schoolConfig.city, schoolConfig.state]
    .filter((part) => part.trim().length > 0)
    .join(" - ");

  return (
    <div
      style={themeStyle}
      className="flex min-h-[100dvh] flex-col bg-[#F7F7F8] text-zinc-900 dark:bg-[#0C0D0F] dark:text-zinc-100"
    >
      {/* Cabecalho superior discreto */}
      <header className="sticky top-0 z-30 h-14 border-b border-zinc-200/80 bg-white/95 dark:border-white/[0.08] dark:bg-[#131518]/95">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <LegalBackButton />

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Acessar portal
            </Link>
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {/* Navegacao rapida entre os 3 documentos legais */}
        <nav
          aria-label="Documentos legais do portal"
          className="mb-6 flex flex-wrap items-center gap-1.5"
        >
          {LEGAL_NAV_LINKS.map((item) => {
            const isActive = item.slug === activeSlug;
            return (
              <Link
                key={item.slug}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border border-zinc-200/90 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-[#131518] dark:text-zinc-300 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Cartao editorial do documento */}
        <article className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
          <div
            aria-hidden="true"
            className="h-[3px] w-full bg-[var(--school-primary)]"
          />

          <div className="p-6 sm:p-8 lg:p-10">
            {/* Identificacao institucional */}
            <div className="flex flex-col gap-4 border-b border-zinc-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08]">
              <div className="flex min-w-0 items-center gap-3">
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
                    <BookOpenCheck
                      className="h-4 w-4"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
                    {schoolConfig.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                    {[
                      locationLine,
                      schoolConfig.phone ? `Tel.: ${schoolConfig.phone}` : "",
                      `Ano letivo ${schoolConfig.schoolYear}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                Atualizado em {lastUpdated}
              </span>
            </div>

            {/* Titulo editorial */}
            <header className="mt-6 space-y-2">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-zinc-900 sm:text-[26px] dark:text-zinc-100">
                {title}
              </h1>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {subtitle}
              </p>
            </header>

            {/* Corpo do documento */}
            <div className="mt-8 space-y-7 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {children(schoolConfig)}
            </div>

            {/* Nota institucional de governanca */}
            <aside className="mt-10 flex items-start gap-3 rounded-lg border border-zinc-200/80 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-600 dark:border-white/[0.08] dark:bg-[#1A1D21]/60 dark:text-zinc-400">
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <p>
                <strong className="font-medium text-zinc-800 dark:text-zinc-200">
                  Nota institucional:
                </strong>{" "}
                este documento constitui a política institucional base do portal
                Registro de Classe Online (RCO), estando sujeito à revisão e
                validação administrativa e jurídica pela direção de{" "}
                {schoolConfig.name}.
              </p>
            </aside>
          </div>
        </article>
      </main>

      {/* Rodape editorial discreto */}
      <footer className="border-t border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#131518]">
        <div className="mx-auto flex max-w-3xl flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:px-6 dark:text-zinc-400">
          <p className="tabular-nums">
            {schoolConfig.name} · Ano letivo {schoolConfig.schoolYear}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Página inicial
            </Link>
            <Link
              href="/validar"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Validar documento
            </Link>
            <Link
              href="/login"
              className="font-medium text-zinc-800 transition-colors hover:text-[var(--school-primary)] dark:text-zinc-200"
            >
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
