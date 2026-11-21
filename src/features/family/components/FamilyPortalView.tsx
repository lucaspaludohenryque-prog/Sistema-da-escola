"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileCheck2,
  FileText,
  FileWarning,
  GraduationCap,
  Loader2,
  Medal,
  Printer,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { BADGE_CATEGORY_META } from "@/features/badges/types";
import {
  LOW_ATTENDANCE_THRESHOLD,
  formatIsoDateBr,
} from "@/features/attendance/constants";
import { SHIFT_LABELS } from "@/features/classrooms/constants";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import {
  PASSING_GRADE_THRESHOLD,
  TERM_LABELS,
  formatScoreBr,
} from "@/features/grades/constants";
import {
  JUSTIFICATION_STATUS_LABELS,
  JUSTIFICATION_STATUS_STYLES,
} from "@/features/justifications/types";
import {
  OCCURRENCE_PRAISE_STYLE,
  OCCURRENCE_SEVERITY_LABELS,
  OCCURRENCE_SEVERITY_STYLES,
  OCCURRENCE_STATUS_LABELS,
  OCCURRENCE_STATUS_STYLES,
  OCCURRENCE_TYPE_LABELS,
} from "@/features/occurrences/constants";
import { Avatar } from "@/shared/components/Avatar";
import { useToast } from "@/shared/components/ToastProvider";
import type { FamilyAbsenceEntry, FamilyOverviewData } from "../types";
import { TermEvolutionChart } from "./TermEvolutionChart";

interface FamilyPortalViewProps {
  overview: FamilyOverviewData;
  userName: string;
}

export function FamilyPortalView({
  overview,
  userName,
}: FamilyPortalViewProps): React.JSX.Element {
  const toast = useToast();
  const [studentsData, setStudentsData] = useState(overview.students);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isGuardian = overview.role === "RESPONSAVEL";

  const [absenceToJustify, setAbsenceToJustify] =
    useState<FamilyAbsenceEntry | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmittingJustification, setIsSubmittingJustification] =
    useState(false);

  const activeStudent = studentsData[selectedIndex] ?? studentsData[0];

  if (!activeStudent) {
    return (
      <section className="rounded-xl border border-zinc-200/80 bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
          <Users className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {isGuardian
            ? "Nenhum estudante vinculado à sua conta"
            : "Seu cadastro escolar ainda não foi vinculado"}
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Procure a secretaria ou coordenação da escola para concluir o vínculo da sua conta com a
          matrícula escolar.
        </p>
      </section>
    );
  }

  const { student, classroom, attendance, terms, annualAverage, occurrences, badges } =
    activeStudent;

  const isLowAttendance =
    attendance.attendanceRate !== null &&
    attendance.attendanceRate < LOW_ATTENDANCE_THRESHOLD;
  const isLowAverage =
    annualAverage !== null && annualAverage < PASSING_GRADE_THRESHOLD;

  async function handleSubmitJustification(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    if (!absenceToJustify) return;

    if (reason.trim().length < 5) {
      toast.warning("Informe o motivo da falta com ao menos 5 caracteres.");
      return;
    }

    setIsSubmittingJustification(true);
    try {
      const response = await fetch("/api/justifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: absenceToJustify.attendanceId,
          reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível enviar a justificativa.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await response.json()) as {
        justification: { id: string; status: "PENDENTE"; reason: string };
      };

      setStudentsData((prev) =>
        prev.map((entry, idx) => {
          if (idx !== selectedIndex) return entry;
          return {
            ...entry,
            attendance: {
              ...entry.attendance,
              absences: entry.attendance.absences.map((a) =>
                a.attendanceId === absenceToJustify.attendanceId
                  ? {
                      ...a,
                      justification: {
                        id: payload.justification.id,
                        status: "PENDENTE",
                        reason: payload.justification.reason,
                        reviewNote: null,
                      },
                    }
                  : a
              ),
            },
          };
        })
      );

      setAbsenceToJustify(null);
      setReason("");
      toast.success(
        "Justificativa enviada para análise da Coordenação.",
        "Pedido registrado"
      );
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setIsSubmittingJustification(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Alerta discreto de avisos pendentes */}
      {overview.unacknowledgedCount > 0 ? (
        <section className="flex flex-col gap-3 rounded-xl border border-amber-200/90 bg-amber-50/70 px-4 py-3.5 text-amber-950 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-medium">
                {overview.unacknowledgedCount}{" "}
                {overview.unacknowledgedCount === 1
                  ? "aviso escolar aguardando confirmação de ciência"
                  : "avisos escolares aguardando confirmação de ciência"}
              </p>
              <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-200/80">
                Consulte faltas, comunicados ou ocorrências na Central de Avisos.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/avisos"
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-amber-700 px-3.5 text-xs font-medium text-white transition-colors hover:bg-amber-800 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
          >
            Abrir Avisos
          </Link>
        </section>
      ) : null}

      {/* Cabecalho limpo do estudante e seletor de filhos */}
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <Avatar name={student.name} size="md" className="mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isGuardian
                  ? `Responsável: ${userName}`
                  : "Acompanhamento individual"}
              </p>
              <h2 className="mt-0.5 text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
                {student.name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                  <BookOpen className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} aria-hidden="true" />
                  {classroom.name} · {classroom.subject} ({SHIFT_LABELS[classroom.shift]})
                </span>
                <span className="font-mono tabular-nums">
                  Matrícula {student.registration}
                </span>
                <span className="inline-flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
                  {classroom.teacherName}
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/dashboard/alunos/${student.id}/ficha`}
            className="inline-flex h-9 w-fit shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[var(--school-primary-hover)]"
          >
            <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span>Boletim / Ficha A4</span>
          </Link>
        </div>

        {isGuardian && studentsData.length > 1 ? (
          <div
            className="flex flex-wrap items-center gap-2 border-t border-zinc-200/80 pt-3 dark:border-white/[0.08]"
            role="tablist"
            aria-label="Filhos vinculados"
          >
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Estudante:
            </span>
            {studentsData.map((entry, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={entry.student.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedIndex(idx)}
                  className={`inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-[var(--school-primary)] bg-[var(--school-primary)] text-white"
                      : "border-zinc-200/90 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.09] dark:bg-[#131518] dark:text-zinc-300 dark:hover:bg-[#1A1D21]"
                  }`}
                >
                  <Avatar name={entry.student.name} size="xs" />
                  <span>
                    {entry.student.name}{" "}
                    <span className="opacity-75">({entry.classroom.name})</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      {/* Faixa limpa de KPIs */}
      <section
        aria-label="Resumo escolar"
        className="grid grid-cols-2 gap-3.5 xl:grid-cols-4"
      >
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Frequência Geral
            </p>
            <ClipboardCheck className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p
            className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${
              isLowAttendance
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {attendance.attendanceRate !== null
              ? `${attendance.attendanceRate}%`
              : "-"}
          </p>
          <p className="mt-1.5 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            {attendance.totalLessons}{" "}
            {attendance.totalLessons === 1 ? "aula registrada" : "aulas registradas"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Média Geral
            </p>
            <GraduationCap className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p
            className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${
              annualAverage === null
                ? "text-zinc-900 dark:text-zinc-100"
                : isLowAverage
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {formatScoreBr(annualAverage)}
          </p>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Mínimo para aprovação: 6,0
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Total de Faltas
            </p>
            <Calendar className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
            {attendance.absentCount}
          </p>
          <p className="mt-1.5 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            {attendance.justifiedCount}{" "}
            {attendance.justifiedCount === 1 ? "justificada" : "justificadas"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Ocorrências
            </p>
            <FileWarning className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
            {occurrences.length}
          </p>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Registros disciplinares e elogios
          </p>
        </div>
      </section>

      {/* Estante sobria e elegante de Medalhas de Merito */}
      {badges.length > 0 ? (
        <section
          aria-label="Reconhecimentos de Mérito"
          className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none"
        >
          <div className="mb-4 flex items-center justify-between gap-2 border-b border-zinc-200/70 pb-3 dark:border-white/[0.07]">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Reconhecimentos de Mérito
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Distinções concedidas pela equipe pedagógica neste ano letivo
              </p>
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
              <Award className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" strokeWidth={1.75} aria-hidden="true" />
              {badges.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => {
              const meta = BADGE_CATEGORY_META[badge.category];
              return (
                <div
                  key={badge.id}
                  className="flex items-start gap-3 rounded-lg border border-zinc-200/80 bg-zinc-50/60 p-3.5 dark:border-white/[0.08] dark:bg-[#1A1D21]/60"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200/80 bg-amber-50/80 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                    <Medal className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      {meta.label}
                    </p>
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {badge.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {badge.reason}
                    </p>
                    <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                      Concedido por {badge.awardedByName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Grafico de Evolucao Trimestral */}
      <TermEvolutionChart terms={terms} />

      {/* Notas por Trimestre */}
      <section
        id="notas"
        aria-labelledby="boletim"
        className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none"
      >
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-zinc-200/70 pb-3 dark:border-white/[0.07]">
          <div className="flex items-center gap-2">
            <FileText
              className="h-4 w-4 text-zinc-400 dark:text-zinc-500"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <h3 id="boletim" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Boletim e Notas por Trimestre
            </h3>
          </div>
          <span className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            Ano {classroom.year}
          </span>
        </div>

        <div className="space-y-4">
          {terms.map((termItem) => {
            const isTermLow =
              termItem.termAverage !== null &&
              termItem.termAverage < PASSING_GRADE_THRESHOLD;

            return (
              <div
                key={termItem.term}
                className="overflow-hidden rounded-lg border border-zinc-200/80 dark:border-white/[0.08]"
              >
                <div className="flex items-center justify-between border-b border-zinc-200/70 bg-zinc-50/80 px-4 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {TERM_LABELS[termItem.term]}
                  </h4>
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-xs font-medium tabular-nums ${
                      termItem.termAverage === null
                        ? "bg-zinc-200/70 text-zinc-600 dark:bg-white/[0.07] dark:text-zinc-400"
                        : isTermLow
                          ? "border border-red-200/80 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                          : "border border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                    }`}
                  >
                    Média: {formatScoreBr(termItem.termAverage)}
                  </span>
                </div>

                {termItem.assessments.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    Nenhuma avaliação lançada neste trimestre.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200/70 text-left text-xs dark:divide-white/[0.06]">
                      <thead className="bg-zinc-50/40 text-[11px] font-medium tracking-wider text-zinc-500 uppercase dark:bg-white/[0.02] dark:text-zinc-400">
                        <tr>
                          <th scope="col" className="px-4 py-2.5 font-medium">
                            Avaliação
                          </th>
                          <th scope="col" className="px-3 py-2.5 font-medium">
                            Data
                          </th>
                          <th scope="col" className="px-3 py-2.5 text-center font-medium">
                            Peso
                          </th>
                          <th scope="col" className="px-4 py-2.5 text-right font-medium">
                            Nota
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/60 bg-white dark:divide-white/[0.06] dark:bg-[#131518]">
                        {termItem.assessments.map((assessment) => (
                          <tr
                            key={assessment.assessmentId}
                            className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]"
                          >
                            <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                              {assessment.title}
                            </td>
                            <td className="px-3 py-2.5 font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                              {formatIsoDateBr(assessment.date)}
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                              {assessment.weight}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                              {formatScoreBr(assessment.score)}
                              <span className="ml-1 text-[10px] font-normal text-zinc-400 dark:text-zinc-500">
                                / {assessment.maxScore}
                              </span>
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

      {/* Historico de Faltas + Ocorrencias */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section
          id="frequencia"
          className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none"
        >
          <div className="border-b border-zinc-200/80 px-5 py-3.5 dark:border-white/[0.08]">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Histórico de Faltas e Justificativas
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {isGuardian
                ? "Envie justificativas à coordenação para faltas ainda não justificadas"
                : "Aulas em que houve ausência registrada"}
            </p>
          </div>

          {attendance.absences.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Nenhuma falta registrada até o momento.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200/70 dark:divide-white/[0.06]">
              {attendance.absences.map((item) => {
                const canRequestJustification =
                  isGuardian &&
                  item.status === "FALTA" &&
                  (!item.justification || item.justification.status === "RECUSADA");

                return (
                  <li key={item.attendanceId} className="space-y-2 px-5 py-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                        {formatIsoDateBr(item.date)} · {item.lessonNumber}ª aula
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                            item.status === "FALTA"
                              ? "border border-red-200/80 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                              : "border border-amber-200/80 bg-amber-50/70 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                          }`}
                        >
                          {item.status === "FALTA" ? "Falta" : "Falta Justificada"}
                        </span>

                        {item.justification ? (
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${JUSTIFICATION_STATUS_STYLES[item.justification.status]}`}
                          >
                            {JUSTIFICATION_STATUS_LABELS[item.justification.status]}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {item.subject} ({item.classroomName})
                    </p>
                    <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                      Conteúdo: {item.content}
                    </p>

                    {item.justification?.reviewNote ? (
                      <p className="rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-700 dark:border-white/[0.08] dark:bg-[#1A1D21] dark:text-zinc-300">
                        <span className="font-medium">Parecer: </span>
                        {item.justification.reviewNote}
                      </p>
                    ) : null}

                    {canRequestJustification ? (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAbsenceToJustify(item);
                            setReason(item.justification?.reason ?? "");
                          }}
                          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                          <span>
                            {item.justification?.status === "RECUSADA"
                              ? "Reenviar Justificativa"
                              : "Justificar Falta"}
                          </span>
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          id="ocorrencias"
          className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none"
        >
          <div className="border-b border-zinc-200/80 px-5 py-3.5 dark:border-white/[0.08]">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Histórico de Ocorrências
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Registros pedagógicos, disciplinares e elogios
            </p>
          </div>

          {occurrences.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Nenhuma ocorrência registrada para este estudante.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200/70 dark:divide-white/[0.06]">
              {occurrences.map((item) => {
                const isPraise = item.type === "ELOGIO";

                return (
                  <li key={item.id} className="space-y-2 px-5 py-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                            isPraise
                              ? OCCURRENCE_PRAISE_STYLE
                              : "border border-zinc-200/80 bg-zinc-50 text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-300"
                          }`}
                        >
                          {OCCURRENCE_TYPE_LABELS[item.type]}
                        </span>
                        {!isPraise ? (
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${OCCURRENCE_SEVERITY_STYLES[item.severity]}`}
                          >
                            {OCCURRENCE_SEVERITY_LABELS[item.severity]}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${OCCURRENCE_STATUS_STYLES[item.status]}`}
                        >
                          {OCCURRENCE_STATUS_LABELS[item.status]}
                        </span>
                      </div>

                      <span className="font-mono text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                        {formatIsoDateBr(item.date)}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {item.description}
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      Registrado por {item.authorName}
                    </p>

                    {item.resolutionNote ? (
                      <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                        <span className="font-medium text-emerald-800 dark:text-emerald-300">
                          Encaminhamento:{" "}
                        </span>
                        {item.resolutionNote}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Modal Justificar Falta */}
      {absenceToJustify ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="justify-modal-title"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={() => {
              if (!isSubmittingJustification) setAbsenceToJustify(null);
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-zinc-200/90 bg-white p-6 shadow-[var(--shadow-popover)] dark:border-white/10 dark:bg-[#131518]">
            <div className="flex items-start justify-between border-b border-zinc-200/80 pb-4 dark:border-white/[0.08]">
              <div>
                <h3
                  id="justify-modal-title"
                  className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  Justificar Falta
                </h3>
                <p className="mt-0.5 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                  {formatIsoDateBr(absenceToJustify.date)} ·{" "}
                  {absenceToJustify.lessonNumber}ª aula ({absenceToJustify.subject})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbsenceToJustify(null)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitJustification} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="justification-reason"
                  className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Motivo da ausência
                </label>
                <textarea
                  id="justification-reason"
                  rows={4}
                  required
                  disabled={isSubmittingJustification}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex.: Consulta médica com atestado entregue na secretaria..."
                  className="block w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-200/80 pt-4 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setAbsenceToJustify(null)}
                  disabled={isSubmittingJustification}
                  className="h-9 cursor-pointer rounded-lg border border-zinc-200/90 bg-white px-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJustification}
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[var(--school-primary)] px-3.5 text-sm font-medium text-white hover:bg-[var(--school-primary-hover)] disabled:opacity-70"
                >
                  {isSubmittingJustification ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  <span>Enviar Justificativa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
