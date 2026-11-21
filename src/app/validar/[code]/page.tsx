/* eslint-disable @next/next/no-img-element -- Brasao institucional na pagina publica de validacao. */

import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  Calendar,
  CheckCircle2,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
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
  title: "Resultado da Validação Antifraude",
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

  return (
    <div
      style={themeStyle}
      className="flex min-h-[100dvh] flex-col bg-[#F6F8FA] text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/validar"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 transition-colors hover:text-[var(--school-primary)] dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span>Validar outro código</span>
          </Link>
          <ThemeToggleButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        {verification ? (
          <article className="overflow-hidden rounded-3xl border border-emerald-200/90 bg-white shadow-xl dark:border-emerald-500/30 dark:bg-slate-900">
            {/* Selo verde animado de autenticidade */}
            <div className="flex flex-col items-center bg-emerald-600 px-6 py-8 text-center text-white">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/25">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-ping rounded-full bg-white/25"
                />
                <ShieldCheck className="relative h-9 w-9 text-white" strokeWidth={2} />
              </div>
              <h1 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
                Documento Autêntico e Verificado
              </h1>
              <p className="mt-1 font-mono text-sm font-semibold tracking-wider text-emerald-100">
                {verification.code}
              </p>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              {/* Identidade institucional */}
              <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5 dark:border-slate-800">
                {school.logoUrl ? (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-slate-200 dark:ring-slate-700">
                    <img
                      src={school.logoUrl}
                      alt={`Brasão ${school.name}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--school-primary)] text-white">
                    <BookOpenCheck className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {school.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {verification.title}
                  </p>
                </div>
              </div>

              {/* Metadados oficiais */}
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                  <dt className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    {verification.docType === "BOLETIM" ? "Estudante" : "Turma / Referência"}
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {verification.subjectName}
                  </dd>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                  <dt className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    Turma / Disciplina
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {verification.classroomName}
                  </dd>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                  <dt className="flex items-center gap-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    <UserCheck className="h-3.5 w-3.5" /> Emitido por
                  </dt>
                  <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                    {verification.issuedByName}
                  </dd>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                  <dt className="flex items-center gap-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5" /> Data e Hora da Emissão
                  </dt>
                  <dd className="mt-1 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {formatDateTimeBr(verification.issuedAt)}
                  </dd>
                </div>
              </dl>

              {/* Resumo numerico nao sensivel */}
              <div className="rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <FileCheck2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Resumo Oficial Registrado no Momento da Emissão</span>
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {verification.summary.schoolYear ? (
                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Ano Letivo</p>
                      <p className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white">
                        {verification.summary.schoolYear}
                      </p>
                    </div>
                  ) : null}

                  {verification.summary.termLabel ? (
                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Período</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                        {verification.summary.termLabel}
                      </p>
                    </div>
                  ) : null}

                  {verification.summary.attendanceRate !== undefined ? (
                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Frequência</p>
                      <p className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white">
                        {verification.summary.attendanceRate !== null
                          ? `${verification.summary.attendanceRate}%`
                          : "-"}
                      </p>
                    </div>
                  ) : null}

                  {verification.summary.overallAverage !== undefined ? (
                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Média Geral</p>
                      <p className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white">
                        {formatScoreBr(verification.summary.overallAverage)}
                      </p>
                    </div>
                  ) : null}

                  {verification.summary.totalStudents !== undefined ? (
                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Alunos Ativos</p>
                      <p className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white">
                        {verification.summary.totalStudents}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Registro confirmado na base oficial do RCO.</span>
              </div>
            </div>
          </article>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-red-200/90 bg-white shadow-xl dark:border-red-500/30 dark:bg-slate-900">
            <div className="flex flex-col items-center bg-red-600 px-6 py-8 text-center text-white">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/25">
                <ShieldAlert className="h-9 w-9 text-white" strokeWidth={2} />
              </div>
              <h1 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
                Código Inválido ou Não Encontrado
              </h1>
              <p className="mt-1 font-mono text-sm text-red-100">{decodedCode}</p>
            </div>

            <div className="space-y-4 p-6 text-center sm:p-8">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Não localizamos nenhum documento oficial correspondente a este código na base de
                verificação de <strong>{school.name}</strong>. Verifique se todos os caracteres
                foram digitados corretamente.
              </p>
              <div className="pt-2">
                <Link
                  href="/validar"
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--school-primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--school-primary-hover)]"
                >
                  Tentar outro código
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
