/* eslint-disable @next/next/no-img-element -- Brasao institucional na pagina publica de validacao. */

import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { formatScoreBr } from "@/features/grades/constants";
import {
  buildSchoolThemeStyle,
  getDefaultSchoolConfig,
  getSchoolConfig,
} from "@/features/school-config";
import { findPublicVerificationByCode } from "@/features/verifications/queries";
import { ThemeToggleButton } from "@/shared/components/ThemeToggleButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resultado da Validação",
  description: "Verificação de autenticidade de documento emitido pelo RCO.",
};

interface ValidateResultPageProps {
  params: Promise<{ code: string }>;
}

function formatDateTimeBr(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function ValidateCodeResultPage({
  params,
}: ValidateResultPageProps): Promise<React.JSX.Element> {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);

  const [verification, fallbackSchool] = await Promise.all([
    findPublicVerificationByCode(decodedCode).catch(() => null),
    getSchoolConfig().catch(() => getDefaultSchoolConfig()),
  ]);

  const school = verification?.school ?? fallbackSchool;
  const themeStyle = buildSchoolThemeStyle(school.primaryColor) as CSSProperties;

  const summaryItems: Array<{ label: string; value: string; mono?: boolean }> = [];
  if (verification) {
    if (verification.summary.schoolYear) {
      summaryItems.push({
        label: "Ano letivo",
        value: String(verification.summary.schoolYear),
        mono: true,
      });
    }
    if (verification.summary.termLabel) {
      summaryItems.push({
        label: "Período",
        value: verification.summary.termLabel,
      });
    }
    if (verification.summary.attendanceRate !== undefined) {
      summaryItems.push({
        label: "Frequência",
        value:
          verification.summary.attendanceRate !== null
            ? `${verification.summary.attendanceRate}%`
            : "-",
        mono: true,
      });
    }
    if (verification.summary.overallAverage !== undefined) {
      summaryItems.push({
        label: "Média geral",
        value: formatScoreBr(verification.summary.overallAverage),
        mono: true,
      });
    }
    if (verification.summary.totalStudents !== undefined) {
      summaryItems.push({
        label: "Alunos ativos",
        value: String(verification.summary.totalStudents),
        mono: true,
      });
    }
  }

  return (
    <div
      style={themeStyle}
      className="flex min-h-[100dvh] flex-col bg-[#F7F7F8] text-zinc-900 dark:bg-[#0C0D0F] dark:text-zinc-100"
    >
      <header className="h-14 border-b border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#131518]">
        <div className="mx-auto flex h-full max-w-xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/validar"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>Validar outro código</span>
          </Link>
          <ThemeToggleButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        {verification ? (
          <article className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
            <div
              aria-hidden="true"
              className="h-[3px] w-full bg-emerald-600 dark:bg-emerald-500"
            />

            <div className="space-y-6 p-6 sm:p-8">
              {/* Identidade institucional no topo */}
              <div className="flex items-center gap-3.5">
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
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    Certidão Digital de Autenticidade · RCO
                  </p>
                </div>
              </div>

              {/* Selo sobrio de autenticidade */}
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200/90 bg-emerald-50/70 px-4 py-3.5 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm font-semibold tracking-[-0.01em] text-emerald-950 dark:text-emerald-200">
                    Documento autêntico e verificado
                  </h1>
                  <p className="mt-0.5 font-mono text-xs font-medium tracking-wider text-emerald-800 dark:text-emerald-300">
                    {verification.code}
                  </p>
                </div>
              </div>

              {/* Tabela chave-valor oficial */}
              <div className="overflow-hidden rounded-lg border border-zinc-200/80 dark:border-white/[0.08]">
                <dl className="divide-y divide-zinc-200/70 text-sm dark:divide-white/[0.07]">
                  <div className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-12 sm:items-baseline sm:gap-3">
                    <dt className="text-xs font-medium text-zinc-500 sm:col-span-4 dark:text-zinc-400">
                      Tipo de documento
                    </dt>
                    <dd className="font-medium text-zinc-900 sm:col-span-8 dark:text-zinc-100">
                      {verification.title}
                    </dd>
                  </div>

                  <div className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-12 sm:items-baseline sm:gap-3">
                    <dt className="text-xs font-medium text-zinc-500 sm:col-span-4 dark:text-zinc-400">
                      {verification.docType === "BOLETIM"
                        ? "Estudante"
                        : "Turma / Referência"}
                    </dt>
                    <dd className="font-medium text-zinc-900 sm:col-span-8 dark:text-zinc-100">
                      {verification.subjectName}
                    </dd>
                  </div>

                  <div className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-12 sm:items-baseline sm:gap-3">
                    <dt className="text-xs font-medium text-zinc-500 sm:col-span-4 dark:text-zinc-400">
                      Turma / Disciplina
                    </dt>
                    <dd className="text-zinc-800 sm:col-span-8 dark:text-zinc-200">
                      {verification.classroomName}
                    </dd>
                  </div>

                  <div className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-12 sm:items-baseline sm:gap-3">
                    <dt className="text-xs font-medium text-zinc-500 sm:col-span-4 dark:text-zinc-400">
                      Emissor
                    </dt>
                    <dd className="text-zinc-800 sm:col-span-8 dark:text-zinc-200">
                      {verification.issuedByName}
                    </dd>
                  </div>

                  <div className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-12 sm:items-baseline sm:gap-3">
                    <dt className="text-xs font-medium text-zinc-500 sm:col-span-4 dark:text-zinc-400">
                      Data e hora de emissão
                    </dt>
                    <dd className="font-mono text-xs font-medium text-zinc-800 tabular-nums sm:col-span-8 dark:text-zinc-200">
                      {formatDateTimeBr(verification.issuedAt)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Resumo oficial registrado */}
              {summaryItems.length > 0 ? (
                <div>
                  <p className="mb-2.5 text-xs font-medium tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                    Resumo oficial registrado na emissão
                  </p>
                  <div className="overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-200/80 dark:border-white/[0.08] dark:bg-white/[0.08]">
                    <div className="grid grid-cols-2 gap-px sm:grid-cols-3">
                      {summaryItems.map((item) => (
                        <div
                          key={item.label}
                          className="bg-zinc-50/60 px-3.5 py-3 dark:bg-[#1A1D21]/60"
                        >
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {item.label}
                          </p>
                          <p
                            className={`mt-1 text-sm font-semibold text-zinc-900 tabular-nums dark:text-zinc-100 ${
                              item.mono ? "font-mono" : ""
                            }`}
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <p className="border-t border-zinc-200/70 pt-4 text-xs text-zinc-500 dark:border-white/[0.08] dark:text-zinc-400">
                Registro conferido diretamente na base oficial de {school.name}.
              </p>
            </div>
          </article>
        ) : (
          <section className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
            <div
              aria-hidden="true"
              className="h-[3px] w-full bg-red-600 dark:bg-red-500"
            />

            <div className="space-y-5 p-6 sm:p-8">
              <div className="flex items-start gap-3 rounded-lg border border-red-200/90 bg-red-50/70 px-4 py-3.5 dark:border-red-500/25 dark:bg-red-500/10">
                <ShieldAlert
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm font-semibold tracking-[-0.01em] text-red-950 dark:text-red-200">
                    Código inválido ou não encontrado
                  </h1>
                  <p className="mt-0.5 font-mono text-xs font-medium text-red-800 dark:text-red-300">
                    {decodedCode}
                  </p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Não foi localizado nenhum documento oficial correspondente a este código na
                base de verificação de{" "}
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  {school.name}
                </strong>
                . Confira todos os caracteres impressos no documento e tente novamente.
              </p>

              <div>
                <Link
                  href="/validar"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--school-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--school-primary-hover)]"
                >
                  Consultar outro código
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
