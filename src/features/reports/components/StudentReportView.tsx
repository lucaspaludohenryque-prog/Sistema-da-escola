"use client";
/* eslint-disable @next/next/no-img-element -- Exibe brasao da escola em Base64 com suporte direto a impressao A4. */

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, BookOpenCheck, MessageCircle, Printer } from "lucide-react";
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
  LEVE: "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200",
  MEDIA: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
  GRAVE: "bg-red-50 text-red-800 ring-1 ring-inset ring-red-200",
};

const PRINT_STATUS_STYLES: Record<OccurrenceStatus, string> = {
  PENDENTE: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  RESOLVIDO: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200",
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
  const { school, student, classroom, attendance, terms, annualAverage, occurrences } =
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

  useEffect(() => {
    let active = true;
    const targetUrl =
      typeof window !== "undefined"
        ? window.location.href
        : `https://rcolasalle.vercel.app/dashboard/alunos/${student.id}/ficha`;

    QRCode.toDataURL(targetUrl, {
      width: 152,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setQrCodeDataUrl(url);
      })
      .catch(() => {
        // Ignora erro de geracao de QR em ambientes restritos.
      });

    return () => {
      active = false;
    };
  }, [student.id]);

  const waSummaryText = `Olá, ${student.guardianName}! Resumo escolar enviado por ${school.name}:\nEstudante: ${student.name} (${classroom.name} - ${classroom.subject})\nFrequência Geral: ${
    attendance.attendanceRate !== null ? `${attendance.attendanceRate}%` : "Sem registros"
  } (${attendance.absentCount} faltas)\nMédia Geral: ${formatScoreBr(annualAverage)}\nOcorrências registradas: ${occurrences.length}`;
  const whatsAppUrl = buildWhatsAppUrl(student.guardianPhone, waSummaryText);

  return (
    <div className="mx-auto w-full max-w-4xl px-1 pt-6 pb-12 sm:px-4 print:max-w-none print:p-0">
      {/* Barra de ferramentas elegante acima da folha A4 (oculta na impressao) */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-800 dark:bg-slate-900/95 print:hidden">
        <Link
          href={backHref ?? `/dashboard/turmas/${classroom.id}`}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          <span>{backLabel ?? `Voltar para ${classroom.name}`}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          {whatsAppUrl ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 sm:text-sm dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Enviar resumo no WhatsApp</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Telefone do responsável não cadastrado"
              className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-400 sm:text-sm dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Enviar resumo no WhatsApp</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--school-primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--school-primary-hover)] active:scale-[0.98] sm:text-sm"
          >
            <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* Documento A4 imprimivel (sempre folha branca e tinta escura para fidelidade de impressao/PDF) */}
      <article className="rco-print-sheet mx-auto w-full max-w-4xl rounded-2xl bg-white p-6 text-slate-900 shadow-2xl ring-1 ring-slate-200/80 sm:p-10 dark:ring-slate-700 print:max-w-none print:rounded-none print:bg-white print:p-0 print:text-slate-900 print:shadow-none print:ring-0">
        {/* Cabecalho institucional formal */}
        <header className="flex flex-col gap-4 border-b-2 border-slate-900 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            {school.logoUrl ? (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5">
                <img
                  src={school.logoUrl}
                  alt={`Brasão ${school.name}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--school-primary)] text-white print:border print:border-slate-900">
                <BookOpenCheck className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
              </div>
            )}
            <div>
              <p className="text-xs font-bold tracking-wide text-[var(--school-primary)] uppercase">
                {school.name}
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Ficha Individual e Boletim Escolar
              </h1>
              <p className="mt-0.5 text-xs text-slate-600">
                {schoolMetaParts.join(" · ")}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Emitido em {formatDateTimeBr(report.generatedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-left sm:text-right">
              <p className="text-[11px] font-medium text-slate-500">Matrícula / CGM</p>
              <p className="font-mono text-sm font-bold text-slate-900">
                {student.registration}
              </p>
            </div>
            {qrCodeDataUrl ? (
              <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-1.5 text-center">
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code de consulta digital de ${student.name}`}
                  width={76}
                  height={76}
                  className="h-[76px] w-[76px]"
                />
                <span className="mt-1 max-w-[82px] text-[9px] leading-tight text-slate-500">
                  Consulta digital do documento
                </span>
              </div>
            ) : null}
          </div>
        </header>

        {/* 1. Dados do estudante e turma */}
        <section className="print-avoid-break mt-6">
          <h2 className="border-b border-slate-200 pb-2 text-xs font-bold tracking-wider text-slate-700 uppercase">
            1. Identificação do Estudante e Turma
          </h2>

          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Estudante</dt>
              <dd className="font-semibold text-slate-900">
                {student.name}
                {!student.active ? (
                  <span className="ml-2 inline-flex rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                    Inativo
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Turma e Disciplina</dt>
              <dd className="font-semibold text-slate-900">
                {classroom.name} - {classroom.subject} ({SHIFT_LABELS[classroom.shift]})
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Responsável Legal</dt>
              <dd className="font-medium text-slate-800">{student.guardianName}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Telefone de Contato</dt>
              <dd className="font-mono text-xs font-medium text-slate-800">
                {student.guardianPhone}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">Professor(a) Responsável</dt>
              <dd className="font-medium text-slate-800">{classroom.teacherName}</dd>
            </div>
          </dl>
        </section>

        {/* 2. Resumo de Frequencia */}
        <section className="print-avoid-break mt-7">
          <h2 className="border-b border-slate-200 pb-2 text-xs font-bold tracking-wider text-slate-700 uppercase">
            2. Resumo de Frequência
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-[11px] text-slate-500">Aulas registradas</p>
              <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                {attendance.totalLessons}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-[11px] text-slate-500">Presenças</p>
              <p className="mt-1 font-mono text-lg font-bold text-emerald-700">
                {attendance.presentCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-[11px] text-slate-500">Faltas</p>
              <p className="mt-1 font-mono text-lg font-bold text-red-700">
                {attendance.absentCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-[11px] text-slate-500">Justificadas</p>
              <p className="mt-1 font-mono text-lg font-bold text-amber-800">
                {attendance.justifiedCount}
              </p>
            </div>
            <div
              className={`col-span-2 rounded-xl border p-3 sm:col-span-1 ${
                isLowAttendance
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 bg-slate-50/70"
              }`}
            >
              <p className="text-[11px] text-slate-600">Frequência Geral</p>
              <p
                className={`mt-1 font-mono text-lg font-bold ${
                  isLowAttendance ? "text-red-700" : "text-slate-900"
                }`}
              >
                {attendance.attendanceRate !== null
                  ? `${attendance.attendanceRate}%`
                  : "-"}
              </p>
            </div>
          </div>

          {isLowAttendance ? (
            <p className="mt-2 text-xs font-medium text-red-700">
              Atenção: frequência abaixo do mínimo legal de {LOW_ATTENDANCE_THRESHOLD}%.
            </p>
          ) : null}
        </section>

        {/* 3. Notas e Medias por Trimestre */}
        <section className="mt-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <h2 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
              3. Aproveitamento Acadêmico por Trimestre
            </h2>
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 font-mono text-xs font-bold ${
                annualAverage === null
                  ? "bg-slate-100 text-slate-600"
                  : isLowAnnualAverage
                    ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                    : "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200"
              }`}
            >
              Média Geral: {formatScoreBr(annualAverage)}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {terms.map((termData) => {
              const isLowTerm =
                termData.termAverage !== null &&
                termData.termAverage < PASSING_GRADE_THRESHOLD;

              return (
                <div
                  key={termData.term}
                  className="print-avoid-break overflow-hidden rounded-xl border border-slate-200"
                >
                  <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
                    <h3 className="text-xs font-bold text-slate-800">
                      {TERM_LABELS[termData.term]}
                    </h3>
                    <span
                      className={`font-mono text-xs font-bold ${
                        termData.termAverage === null
                          ? "text-slate-500"
                          : isLowTerm
                            ? "text-red-700"
                            : "text-emerald-700"
                      }`}
                    >
                      Média: {formatScoreBr(termData.termAverage)}
                    </span>
                  </div>

                  {termData.assessments.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-slate-500">
                      Nenhuma avaliação registrada neste trimestre.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                        <thead className="bg-white text-slate-500">
                          <tr>
                            <th scope="col" className="px-4 py-2 font-semibold">
                              Avaliação
                            </th>
                            <th scope="col" className="px-3 py-2 font-semibold">
                              Data
                            </th>
                            <th scope="col" className="px-3 py-2 text-center font-semibold">
                              Valor Máx.
                            </th>
                            <th scope="col" className="px-3 py-2 text-center font-semibold">
                              Peso
                            </th>
                            <th scope="col" className="px-4 py-2 text-right font-semibold">
                              Nota
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {termData.assessments.map((assessment) => (
                            <tr key={assessment.assessmentId}>
                              <td className="px-4 py-2 font-medium text-slate-900">
                                {assessment.title}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-600">
                                {formatIsoDateBr(assessment.date)}
                              </td>
                              <td className="px-3 py-2 text-center font-mono text-slate-600">
                                {assessment.maxScore.toFixed(1).replace(".", ",")}
                              </td>
                              <td className="px-3 py-2 text-center font-mono text-slate-600">
                                {assessment.weight}
                              </td>
                              <td className="px-4 py-2 text-right font-mono font-semibold text-slate-900">
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
        <section className="mt-7">
          <h2 className="border-b border-slate-200 pb-2 text-xs font-bold tracking-wider text-slate-700 uppercase">
            4. Histórico de Ocorrências e Encaminhamentos ({occurrences.length})
          </h2>

          {occurrences.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              Nenhuma ocorrência disciplinar ou pedagógica registrada para este estudante.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {occurrences.map((item) => {
                const isPraise = item.type === "ELOGIO";

                return (
                  <li
                    key={item.id}
                    className="print-avoid-break rounded-xl border border-slate-200 p-3.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 font-semibold ${
                            isPraise
                              ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200"
                              : "bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-200"
                          }`}
                        >
                          {OCCURRENCE_TYPE_LABELS[item.type]}
                        </span>
                        {!isPraise ? (
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 font-semibold ${PRINT_SEVERITY_STYLES[item.severity]}`}
                          >
                            {OCCURRENCE_SEVERITY_LABELS[item.severity]}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 font-medium ${PRINT_STATUS_STYLES[item.status]}`}
                        >
                          {OCCURRENCE_STATUS_LABELS[item.status]}
                        </span>
                      </div>
                      <span className="font-mono text-slate-500">
                        {formatIsoDateBr(item.date)} · {item.authorName}
                      </span>
                    </div>

                    <p className="mt-2 leading-relaxed text-slate-800">{item.description}</p>

                    {item.resolutionNote ? (
                      <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-emerald-950">
                        <span className="font-semibold text-emerald-800">Encaminhamento: </span>
                        <span>{item.resolutionNote}</span>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Assinaturas formais */}
        <footer className="print-avoid-break mt-12 grid grid-cols-1 gap-8 border-t border-slate-200 pt-8 text-center text-xs text-slate-600 sm:grid-cols-3">
          <div>
            <div className="mx-auto mb-2 w-48 border-b border-slate-400" />
            <p className="font-medium text-slate-800">{classroom.teacherName}</p>
            <p>Professor(a) Responsável</p>
          </div>
          <div>
            <div className="mx-auto mb-2 w-48 border-b border-slate-400" />
            <p className="font-medium text-slate-800">Coordenação Pedagógica</p>
            <p>Assinatura / Carimbo</p>
          </div>
          <div>
            <div className="mx-auto mb-2 w-48 border-b border-slate-400" />
            <p className="font-medium text-slate-800">{student.guardianName}</p>
            <p>Ciência do Responsável</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
