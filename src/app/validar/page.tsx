/* eslint-disable @next/next/no-img-element -- Brasao da escola em tela publica de validacao. */

import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, ShieldCheck } from "lucide-react";
import {
  buildSchoolThemeStyle,
  getDefaultSchoolConfig,
  getSchoolConfig,
} from "@/features/school-config";
import { ValidateCodeForm } from "@/features/verifications/components/ValidateCodeForm";
import { ThemeToggleButton } from "@/shared/components/ThemeToggleButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Validar Documento Escolar",
  description:
    "Consulta pública de autenticidade de boletins e atas emitidas pelo Registro de Classe Online.",
};

export default async function ValidarPage(): Promise<React.JSX.Element> {
  const school = await getSchoolConfig().catch(() => getDefaultSchoolConfig());
  const themeStyle = buildSchoolThemeStyle(school.primaryColor) as CSSProperties;
  const locationLine = [school.city, school.state]
    .filter((part) => part.trim().length > 0)
    .join(" - ");

  return (
    <div
      style={themeStyle}
      className="flex min-h-[100dvh] flex-col bg-[#F7F7F8] text-zinc-900 dark:bg-[#0C0D0F] dark:text-zinc-100"
    >
      <header className="h-14 border-b border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#131518]">
        <div className="mx-auto flex h-full max-w-xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>Página inicial</span>
          </Link>
          <ThemeToggleButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <section className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
          <div
            aria-hidden="true"
            className="h-[3px] w-full bg-[var(--school-primary)]"
          />

          <div className="p-6 sm:p-8">
            {/* Cabecalho de secretaria digital */}
            <div className="flex items-center gap-3.5 border-b border-zinc-200/80 pb-5 dark:border-white/[0.08]">
              {school.logoUrl ? (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 p-1.5 ring-1 ring-zinc-200/80 dark:bg-[#1A1D21] dark:ring-white/[0.08]">
                  <img
                    src={school.logoUrl}
                    alt={`Brasão ${school.name}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--school-primary)] text-white">
                  <BookOpenCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
                  {school.name}
                </p>
                <p className="truncate text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                  Secretaria Digital{locationLine ? ` · ${locationLine}` : ""} ·{" "}
                  {school.schoolYear}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-1.5">
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
                Conferência de documento escolar
              </h1>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Informe o código impresso abaixo do QR Code no boletim ou na ata do
                Conselho de Classe para verificar a autenticidade.
              </p>
            </div>

            <div className="mt-6">
              <ValidateCodeForm />
            </div>
          </div>
        </section>

        <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <ShieldCheck
            className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>
            Consulta pública conforme a LGPD: nenhum telefone ou dado privado é exibido.
          </span>
        </div>
      </main>
    </div>
  );
}
