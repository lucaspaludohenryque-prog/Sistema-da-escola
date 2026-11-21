"use client";
/* eslint-disable @next/next/no-img-element -- Exibe brasao da escola em Base64 com suporte direto a impressao A4. */

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, Award, BookOpenCheck, IdCard, MessageCircle, Printer } from "lucide-react";
import { BADGE_CATEGORY_META } from "@/features/badges/types";
import {
  LOW_ATTENDANCE_THRESHOLD,
  formatIsoDateBr,
} from "@/features/attendance/constants";
import { SHIFT_LABELS } from "@/features/classrooms/constants";
import {
  PASSING_GRADE_THRESHOLD,
  TERM_LABELS,
  formatScoreBr,
} from "@/features/grades/constants";
import {
  OCCURRENCE_SEVERITY_LABELS,
  OCCURRENCE_STATUS_LABELS,
  OCCURRENCE_TYPE_LABELS,
} from "@/features/occurrences/constants";
import type {
  OccurrenceSeverity,
  OccurrenceStatus,
} from "@/features/occurrences/types";
import { buildWhatsAppUrl } from "@/shared/utils/whatsapp";
import type { StudentReportData } from "../types";

interface StudentReportViewProps {
  report: StudentReportData;
  backHref?: string;
  backLabel?: string;
}

/**
 * Badges dedicadas para documento A4 imprimivel: mantem sempre fundo claro e texto escuro
 * mesmo quando o usuario estiver utilizando o Modo Escuro na tela.
 */
const PRINT_SEVERITY_STYLES: Record<OccurrenceSeverity, string> = {
  LEVE: "border border-zinc-300 bg-zinc-50 text-zinc-700",
  MEDIA: "border border-amber-300 bg-amber-50 text-amber-900",
  GRAVE: "border border-red-300 bg-red-50 text-red-800",
};

const PRINT_STATUS_STYLES: Record<OccurrenceStatus, string> = {
  PENDENTE: "border border-zinc-300 bg-zinc-50 text-zinc-700",
  RESOLVIDO: "border border-emerald-300 bg-emerald-50 text-emerald-800",
};

function formatDateTimeBr(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function StudentReportView({
  report,
  backHref,
  backLabel,
}: StudentReportViewProps): React.JSX.Element {
  const { school, student, classroom, attendance, terms, annualAverage, occurrences, badges } =
    report;

  const schoolLocation = [school.city, school.state]
    .filter((part) => part.trim().length > 0)
    .join(" - ");
  const schoolMetaParts = [
    schoolLocation,
    school.phone ? `Tel.: ${school.phone}` : "",
    `Ano Letivo ${school.schoolYear}`,
  ].filter((part) => part.length > 0);

  const isLowAttendance =
    attendance.attendanceRate !== null &&
    attendance.attendanceRate < LOW_ATTENDANCE_THRESHOLD;

  const isLowAnnualAverage =
    annualAverage !== null && annualAverage < PASSING_GRADE_THRESHOLD;

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function registerAndGenerateQr(): Promise<void> {
      let qrTarget =
        typeof window !== "undefined"
          ? window.location.href
          : `https://rcolasalle.vercel.app/dashboard/alunos/${student.id}/ficha`;

      try {
        const res = await fetch("/api/verifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            docType: "BOLETIM",
            title: "Ficha Individual e Boletim Escolar",
            subjectName: student.name,
            classroomName: `${classroom.name} - ${classroom.subject}`,
            summary: {
              schoolYear: school.schoolYear,
              attendanceRate: attendance.attendanceRate,
              overallAverage: annualAverage,
            },
          }),
        });
        if (res.ok && active) {
          const payload = (await res.json()) as {
            code: string;
            verificationUrl: string;
          };
          setVerificationCode(payload.code);
          qrTarget = payload.verificationUrl;
        }
      } catch {
        // Fallback silencioso para URL atual em caso de falha de rede.
      }

      try {
        const url = await QRCode.toDataURL(qrTarget, {
          width: 152,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        if (active) setQrCodeDataUrl(url);
      } catch {
        // Ignora erro de geracao de QR em ambientes restritos.
      }
    }

    void registerAndGenerateQr();

    return () => {
      active = false;
    };
  }, [
    student.id,
    student.name,
    classroom.name,
    classroom.subject,
    school.schoolYear,
    attendance.attendanceRate,
    annualAverage,
  ]);

  const waSummaryText = `Olá, ${student.guardianName}! Resumo escolar enviado por ${school.name}:\nEstudante: ${student.name} (${classroom.name} - ${classroom.subject})\nFrequência Geral: ${
    attendance.attendanceRate !== null ? `${attendance.attendanceRate}%` : "Sem registros"
  } (${attendance.absentCount} faltas)\nMédia Geral: ${formatScoreBr(annualAverage)}\nOcorrências registradas: ${occurrences.length}`;
  const whatsAppUrl = buildWhatsAppUrl(student.guardianPhone, waSummaryText);

  return (
    <div className="mx-auto w-full max-w-4xl px-1 pt-2 pb-12 sm:px-4 print:max-w-none print:p-0">
      {/* Barra de ferramentas limpa acima da folha A4 (oculta na impressao) */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none print:hidden">
        <Link
          href={backHref ?? `/dashboard/turmas/${classroom.id}`}
          className="inline-flex h-9 w-fit items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 sm:text-sm dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          <span>{backLabel ?? `Voltar para ${classroom.name}`}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/carteirinha?studentId=${student.id}`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 sm:text-sm dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
          >
            <IdCard className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span>Carteirinha</span>
          </Link>

          {whatsAppUrl ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-200/90 bg-emerald-50/70 px-3 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100/70 sm:text-sm dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Enviar no WhatsApp</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Telefone do responsável não cadastrado"
              className="inline-flex h-9 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 px-3 text-xs font-medium text-zinc-400 sm:text-sm dark:border-white/[0.06] dark:bg-[#1A1D21]/50 dark:text-zinc-500"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Enviar no WhatsApp</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-4 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--school-primary-hover)] sm:text-sm"
          >
            <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* Documento A4 oficial (sempre papel branco e tinta escura) */}
      <article className="rco-print-sheet mx-auto w-full max-w-4xl rounded-xl border border-zinc-200/90 bg-white p-6 text-zinc-900 shadow-sm sm:p-10 dark:border-white/10 print:max-w-none print:rounded-none print:border-0 print:bg-white print:p-0 print:text-zinc-900 print:shadow-none">
        {/* Cabecalho institucional equilibrado: brasao | dados da escola | QR + codigo */}
        <header className="grid grid-cols-1 items-center gap-4 border-b border-zinc-900 pb-5 sm:grid-cols-[auto_1fr_auto]">
          <div className="flex items-center justify-start">
            {school.logoUrl ? (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white p-1.5">
                <img
                  src={school.logoUrl}
                  alt={`Brasão ${school.name}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-zinc-900 bg-zinc-900 text-white">
                <BookOpenCheck className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="text-left sm:text-center">
            <p className="text-xs font-semibold tracking-wider text-zinc-600 uppercase">
              {school.name}
            </p>
            <h1 className="mt-0.5 text-lg font-bold tracking-[-0.02em] text-zinc-900 sm:text-xl">
              Ficha Individual e Boletim Escolar
            </h1>
            <p className="mt-0.5 text-xs text-zinc-600 tabular-nums">
              {schoolMetaParts.join(" · ")}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-zinc-500 tabular-nums">
              Matrícula {student.registration} · Emitido em {formatDateTimeBr(report.generatedAt)}
            </p>
          </div>

          <div className="flex items-center justify-start sm:justify-end">
            {qrCodeDataUrl ? (
              <div className="flex flex-col items-center rounded border border-zinc-300 bg-white p-1.5 text-center">
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code de validação antifraude de ${student.name}`}
                  width={68}
                  height={68}
                  className="h-[68px] w-[68px]"
                />
                {verificationCode ? (
                  <span className="mt-1 font-mono text-[8.5px] font-semibold tracking-tight text-zinc-900">
                    {verificationCode}
                  </span>
                ) : null}
                <span className="text-[8px] text-zinc-500">
                  Validação digital
                </span>
              </div>
            ) : (
              <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-right">
                <p className="text-[10px] font-medium text-zinc-500 uppercase">Matrícula</p>
                <p className="font-mono text-xs font-semibold text-zinc-900 tabular-nums">
                  {student.registration}
                </p>
              </div>
            )}
          </div>
        </header>

        {/* 1. Dados do estudante e turma */}
        <section className="print-avoid-break mt-6">
          <h2 className="border-b border-zinc-300 pb-1 text-xs font-semibold tracking-wider text-zinc-700 uppercase">
            1. Identificação do Estudante e Turma
          </h2>

          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2.5 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-[11px] text-zinc-500">Estudante</dt>
              <dd className="mt-0.5 text-sm font-semibold text-zinc-900">
                {student.name}
                {!student.active ? (
                  <span className="ml-2 inline-flex rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700">
                    Inativo
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-zinc-500">Turma e Disciplina</dt>
              <dd className="mt-0.5 text-sm font-semibold text-zinc-900">
                {classroom.name} · {classroom.subject} ({SHIFT_LABELS[classroom.shift]})
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-zinc-500">Responsável Legal</dt>
              <dd className="mt-0.5 font-medium text-zinc-800">{student.guardianName}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-zinc-500">Telefone de Contato</dt>
              <dd className="mt-0.5 font-mono text-xs font-medium text-zinc-800 tabular-nums">
                {student.guardianPhone}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[11px] text-zinc-500">Professor(a) Responsável</dt>
              <dd className="mt-0.5 font-medium text-zinc-800">{classroom.teacherName}</dd>
            </div>
          </dl>
        </section>

        {/* 2. Resumo de Frequencia */}
        <section className="print-avoid-break mt-6">
          <h2 className="border-b border-zinc-300 pb-1 text-xs font-semibold tracking-wider text-zinc-700 uppercase">
            2. Resumo de Frequência
          </h2>

          <div className="mt-3 overflow-hidden rounded border border-zinc-300">
            <div className="grid grid-cols-2 divide-x divide-y divide-zinc-300 text-center sm:grid-cols-5 sm:divide-y-0">
              <div className="px-3 py-2.5">
                <p className="text-[10px] font-medium text-zinc-500 uppercase">Aulas</p>
                <p className="mt-1 font-mono text-base font-semibold text-zinc-900 tabular-nums">
                  {attendance.totalLessons}
                </p>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-[10px] font-medium text-zinc-500 uppercase">Presenças</p>
                <p className="mt-1 font-mono text-base font-semibold text-zinc-900 tabular-nums">
                  {attendance.presentCount}
                </p>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-[10px] font-medium text-zinc-500 uppercase">Faltas</p>
                <p className="mt-1 font-mono text-base font-semibold text-red-700 tabular-nums">
                  {attendance.absentCount}
                </p>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-[10px] font-medium text-zinc-500 uppercase">Justificadas</p>
                <p className="mt-1 font-mono text-base font-semibold text-zinc-800 tabular-nums">
                  {attendance.justifiedCount}
                </p>
              </div>
              <div
                className={`col-span-2 px-3 py-2.5 sm:col-span-1 ${
                  isLowAttendance ? "bg-red-50/70" : "bg-zinc-50"
                }`}
              >
                <p className="text-[10px] font-medium text-zinc-600 uppercase">Frequência</p>
                <p
                  className={`mt-1 font-mono text-base font-bold tabular-nums ${
                    isLowAttendance ? "text-red-700" : "text-zinc-900"
                  }`}
                >
                  {attendance.attendanceRate !== null
                    ? `${attendance.attendanceRate}%`
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {isLowAttendance ? (
            <p className="mt-2 text-xs font-medium text-red-700">
              Atenção: frequência abaixo do mínimo legal de {LOW_ATTENDANCE_THRESHOLD}%.
            </p>
          ) : null}
        </section>

        {/* 3. Notas e Medias por Trimestre */}
        <section className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-300 pb-1">
            <h2 className="text-xs font-semibold tracking-wider text-zinc-700 uppercase">
              3. Aproveitamento Acadêmico por Trimestre
            </h2>
            <span
              className={`font-mono text-xs font-semibold tabular-nums ${
                annualAverage === null
                  ? "text-zinc-600"
                  : isLowAnnualAverage
                    ? "text-red-700"
                    : "text-zinc-900"
              }`}
            >
              Média Geral: {formatScoreBr(annualAverage)}
            </span>
          </div>

          <div className="mt-3 space-y-4">
            {terms.map((termData) => {
              const isLowTerm =
                termData.termAverage !== null &&
                termData.termAverage < PASSING_GRADE_THRESHOLD;

              return (
                <div
                  key={termData.term}
                  className="print-avoid-break overflow-hidden rounded border border-zinc-300"
                >
                  <div className="flex items-center justify-between border-b border-zinc-300 bg-zinc-50 px-3.5 py-2">
                    <h3 className="text-xs font-semibold text-zinc-800">
                      {TERM_LABELS[termData.term]}
                    </h3>
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums ${
                        termData.termAverage === null
                          ? "text-zinc-500"
                          : isLowTerm
                            ? "text-red-700"
                            : "text-zinc-900"
                      }`}
                    >
                      Média: {formatScoreBr(termData.termAverage)}
                    </span>
                  </div>

                  {termData.assessments.length === 0 ? (
                    <p className="px-3.5 py-2.5 text-xs text-zinc-500">
                      Nenhuma avaliação registrada neste trimestre.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
                        <thead className="bg-white text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
                          <tr>
                            <th scope="col" className="px-3.5 py-2 font-medium">
                              Avaliação
                            </th>
                            <th scope="col" className="px-3 py-2 font-medium">
                              Data
                            </th>
                            <th scope="col" className="px-3 py-2 text-center font-medium">
                              Valor Máx.
                            </th>
                            <th scope="col" className="px-3 py-2 text-center font-medium">
                              Peso
                            </th>
                            <th scope="col" className="px-3.5 py-2 text-right font-medium">
                              Nota
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white">
                          {termData.assessments.map((assessment) => (
                            <tr key={assessment.assessmentId}>
                              <td className="px-3.5 py-2 font-medium text-zinc-900">
                                {assessment.title}
                              </td>
                              <td className="px-3 py-2 font-mono text-zinc-600 tabular-nums">
                                {formatIsoDateBr(assessment.date)}
                              </td>
                              <td className="px-3 py-2 text-center font-mono text-zinc-600 tabular-nums">
                                {assessment.maxScore.toFixed(1).replace(".", ",")}
                              </td>
                              <td className="px-3 py-2 text-center font-mono text-zinc-600 tabular-nums">
                                {assessment.weight}
                              </td>
                              <td className="px-3.5 py-2 text-right font-mono font-semibold text-zinc-900 tabular-nums">
                                {formatScoreBr(assessment.score)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Historico de Ocorrencias */}
        <section className="mt-6">
          <h2 className="border-b border-zinc-300 pb-1 text-xs font-semibold tracking-wider text-zinc-700 uppercase">
            4. Histórico de Ocorrências e Encaminhamentos ({occurrences.length})
          </h2>

          {occurrences.length === 0 ? (
            <p className="mt-2.5 text-xs text-zinc-500">
              Nenhuma ocorrência disciplinar ou pedagógica registrada para este estudante.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-200 rounded border border-zinc-300">
              {occurrences.map((item) => {
                const isPraise = item.type === "ELOGIO";

                return (
                  <li key={item.id} className="print-avoid-break p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${
                            isPraise
                              ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                              : "border border-zinc-300 bg-zinc-50 text-zinc-800"
                          }`}
                        >
                          {OCCURRENCE_TYPE_LABELS[item.type]}
                        </span>
                        {!isPraise ? (
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${PRINT_SEVERITY_STYLES[item.severity]}`}
                          >
                            {OCCURRENCE_SEVERITY_LABELS[item.severity]}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${PRINT_STATUS_STYLES[item.status]}`}
                        >
                          {OCCURRENCE_STATUS_LABELS[item.status]}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
                        {formatIsoDateBr(item.date)} · {item.authorName}
                      </span>
                    </div>

                    <p className="mt-1.5 leading-relaxed text-zinc-800">{item.description}</p>

                    {item.resolutionNote ? (
                      <div className="mt-1.5 rounded border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-zinc-800">
                        <span className="font-semibold text-zinc-900">Encaminhamento: </span>
                        <span>{item.resolutionNote}</span>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 5. Conquistas e Medalhas (quando houver) */}
        {badges.length > 0 ? (
          <section className="print-avoid-break mt-6">
            <h2 className="border-b border-zinc-300 pb-1 text-xs font-semibold tracking-wider text-zinc-700 uppercase">
              5. Reconhecimentos de Mérito ({badges.length})
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-start gap-2.5 rounded border border-zinc-300 bg-zinc-50/70 p-3 text-xs"
                >
                  <Award
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900">
                      {badge.title}{" "}
                      <span className="font-normal text-zinc-600">
                        ({BADGE_CATEGORY_META[badge.category].label})
                      </span>
                    </p>
                    <p className="mt-0.5 text-zinc-700">{badge.reason}</p>
                    <p className="mt-1 text-[10px] text-zinc-500">
                      Concedido por {badge.awardedByName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Assinaturas formais (Direcao / Coordenacao / Responsavel) */}
        <footer className="print-avoid-break mt-12 grid grid-cols-1 gap-8 border-t border-zinc-300 pt-8 text-center text-xs text-zinc-600 sm:grid-cols-3">
          <div>
            <div className="mx-auto mb-2 w-48 border-b border-zinc-400" />
            <p className="font-semibold text-zinc-900">Direção Escolar</p>
            <p className="text-[11px] text-zinc-500">Assinatura / Carimbo</p>
          </div>
          <div>
            <div className="mx-auto mb-2 w-48 border-b border-zinc-400" />
            <p className="font-semibold text-zinc-900">Coordenação Pedagógica</p>
            <p className="text-[11px] text-zinc-500">Assinatura / Carimbo</p>
          </div>
          <div>
            <div className="mx-auto mb-2 w-48 border-b border-zinc-400" />
            <p className="font-semibold text-zinc-900">{student.guardianName}</p>
            <p className="text-[11px] text-zinc-500">Ciência do Responsável Legal</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
