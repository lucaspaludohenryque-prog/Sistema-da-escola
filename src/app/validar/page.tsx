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
    "Consulta pública antifraude de boletins e atas emitidas pelo Registro de Classe Online.",
};

export default async function ValidarPage(): Promise<React.JSX.Element> {
  const school = await getSchoolConfig().catch(() => getDefaultSchoolConfig());
  const themeStyle = buildSchoolThemeStyle(school.primaryColor) as CSSProperties;

  return (
    <div
      style={themeStyle}
      className="flex min-h-[100dvh] flex-col bg-[#F6F8FA] text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 transition-colors hover:text-[var(--school-primary)] dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span>Página inicial</span>
          </Link>
          <ThemeToggleButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          {school.logoUrl ? (
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
              <img
                src={school.logoUrl}
                alt={`Brasão ${school.name}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--school-primary)] text-white shadow-sm">
              <BookOpenCheck className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
            </div>
          )}
          <p className="mt-4 text-xs font-bold tracking-wider text-[var(--school-primary)] uppercase dark:text-blue-400">
            {school.name}
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Validação Pública de Documentos
          </h1>
          <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
            Digite o código impresso abaixo do QR Code do boletim ou da ata de conselho para
            confirmar a autenticidade.
          </p>
        </div>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-ambient)] sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <ValidateCodeForm />
        </section>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Consulta protegida conforme LGPD: nenhum telefone ou dado privado é exibido.</span>
        </div>
      </main>
    </div>
  );
}
