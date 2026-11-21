"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  FileWarning,
  GraduationCap,
  Printer,
  UserCheck,
  Users,
} from "lucide-react";
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
  OCCURRENCE_PRAISE_STYLE,
  OCCURRENCE_SEVERITY_LABELS,
  OCCURRENCE_SEVERITY_STYLES,
  OCCURRENCE_STATUS_LABELS,
  OCCURRENCE_STATUS_STYLES,
  OCCURRENCE_TYPE_LABELS,
} from "@/features/occurrences/constants";
import type { FamilyOverviewData } from "../types";

interface FamilyPortalViewProps {
  overview: FamilyOverviewData;
  userName: string;
}

export function FamilyPortalView({
  overview,
  userName,
}: FamilyPortalViewProps): React.JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isGuardian = overview.role === "RESPONSAVEL";

  const activeStudent = overview.students[selectedIndex] ?? overview.students[0];

  if (!activeStudent) {
    return (
      <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Users className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900">
          {isGuardian
            ? "Nenhum estudante vinculado à sua conta"
            : "Seu cadastro escolar ainda não foi vinculado"}
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
          Procure a secretaria ou coordenação da escola para concluir o vínculo da sua conta com a
          matrícula escolar.
        </p>
      </section>
    );
  }

  const { student, classroom, attendance, terms, annualAverage, occurrences } =
    activeStudent;

  const isLowAttendance =
    attendance.attendanceRate !== null &&
    attendance.attendanceRate < LOW_ATTENDANCE_THRESHOLD;
  const isLowAverage =
    annualAverage !== null && annualAverage < PASSING_GRADE_THRESHOLD;

  return (
    <div className="space-y-6">
      {/* Alerta de avisos pendentes */}
      {overview.unacknowledgedCount > 0 ? (
        <section className="flex flex-col gap-3 rounded-2xl bg-amber-50 p-4 text-amber-950 ring-1 ring-inset ring-amber-200 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold">
                Você possui {overview.unacknowledgedCount}{" "}
                {overview.unacknowledgedCount === 1
                  ? "aviso escolar aguardando confirmação"
                  : "avisos escolares aguardando confirmação"}
              </p>
              <p className="text-xs text-amber-800">
                Acesse a Central de Avisos para visualizar faltas ou ocorrências e registrar sua
                ciência.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/avisos"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-800"
          >
            Abrir Avisos
          </Link>
        </section>
      ) : null}

      {/* Cabecalho e seletor de filhos (quando > 1) */}
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {isGuardian ? `Bem-vindo(a), ${userName}` : "Acompanhamento individual somente leitura"}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {student.name}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 font-medium text-[#1E40AF]">
                <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                {classroom.name} - {classroom.subject} ({SHIFT_LABELS[classroom.shift]})
              </span>
              <span className="font-mono text-slate-500">
                Matrícula {student.registration}
              </span>
              <span className="inline-flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                {classroom.teacherName}
              </span>
            </div>
          </div>

          <Link
            href={`/dashboard/alunos/${student.id}/ficha`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[#1E3A8A] active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span>Ficha / Boletim (PDF)</span>
          </Link>
        </div>

        {isGuardian && overview.students.length > 1 ? (
          <div className="mt-5 border-t border-slate-200/80 pt-4">
            <p className="mb-2 text-xs font-semibold text-slate-600">
              Selecionar estudante acompanhado:
            </p>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filhos vinculados">
              {overview.students.map((entry, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={entry.student.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedIndex(idx)}
                    className={`cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                      isSelected
                        ? "bg-[#1E40AF] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                    }`}
                  >
                    {entry.student.name}
                    <span className="ml-1.5 opacity-80">({entry.classroom.name})</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      {/* 4 cards de resumo */}
      <section
        aria-label="Resumo escolar"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">Frequência Geral</p>
              <p
                className={`mt-1 font-mono text-3xl font-bold ${
                  isLowAttendance ? "text-red-700" : "text-slate-900"
                }`}
              >
                {attendance.attendanceRate !== null
                  ? `${attendance.attendanceRate}%`
                  : "-"}
              </p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${
                isLowAttendance
                  ? "bg-red-50 text-red-700 ring-red-200"
                  : "bg-blue-50 text-[#1E40AF] ring-blue-100"
              }`}
            >
              <ClipboardCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2.5 text-xs text-slate-500">
            {attendance.totalLessons}{" "}
            {attendance.totalLessons === 1 ? "aula registrada" : "aulas registradas"}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">Média Geral</p>
              <p
                className={`mt-1 font-mono text-3xl font-bold ${
                  annualAverage === null
                    ? "text-slate-900"
                    : isLowAverage
                      ? "text-red-700"
                      : "text-emerald-700"
                }`}
              >
                {formatScoreBr(annualAverage)}
              </p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${
                annualAverage === null
                  ? "bg-slate-100 text-slate-600 ring-slate-200"
                  : isLowAverage
                    ? "bg-red-50 text-red-700 ring-red-200"
                    : "bg-emerald-50 text-emerald-700 ring-emerald-200"
              }`}
            >
              <GraduationCap className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2.5 text-xs text-slate-500">Mínimo para aprovação: 6,0</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">Total de Faltas</p>
              <p className="mt-1 font-mono text-3xl font-bold text-slate-900">
                {attendance.absentCount}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200">
              <Calendar className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2.5 text-xs text-slate-500">
            {attendance.justifiedCount}{" "}
            {attendance.justifiedCount === 1 ? "justificada" : "justificadas"}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">Ocorrências</p>
              <p className="mt-1 font-mono text-3xl font-bold text-slate-900">
                {occurrences.length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">
              <FileWarning className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2.5 text-xs text-slate-500">Registros disciplinares e elogios</p>
        </div>
      </section>

      {/* Notas por Trimestre */}
      <section
        id="notas"
        aria-labelledby="boletim"
        className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#1E40AF]" strokeWidth={1.75} aria-hidden="true" />
            <h3 id="boletim" className="text-base font-semibold text-slate-900">
              Boletim e Notas por Trimestre
            </h3>
          </div>
          <span className="font-mono text-xs font-semibold text-slate-600">
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
                className="overflow-hidden rounded-xl border border-slate-200/90"
              >
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
                  <h4 className="text-xs font-bold text-slate-800">
                    {TERM_LABELS[termItem.term]}
                  </h4>
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                      termItem.termAverage === null
                        ? "bg-slate-200/70 text-slate-600"
                        : isTermLow
                          ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                          : "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200"
                    }`}
                  >
                    Média: {formatScoreBr(termItem.termAverage)}
                  </span>
                </div>

                {termItem.assessments.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-slate-500">
                    Nenhuma avaliação lançada neste trimestre.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                      <thead className="bg-white text-slate-500">
                        <tr>
                          <th scope="col" className="px-4 py-2.5 font-semibold">
                            Avaliação
                          </th>
                          <th scope="col" className="px-3 py-2.5 font-semibold">
                            Data
                          </th>
                          <th scope="col" className="px-3 py-2.5 text-center font-semibold">
                            Peso
                          </th>
                          <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                            Nota
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {termItem.assessments.map((assessment) => (
                          <tr key={assessment.assessmentId}>
                            <td className="px-4 py-2.5 font-medium text-slate-900">
                              {assessment.title}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-slate-600">
                              {formatIsoDateBr(assessment.date)}
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono text-slate-600">
                              {assessment.weight}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">
                              {formatScoreBr(assessment.score)}
                              <span className="ml-1 text-[10px] font-normal text-slate-400">
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section
          id="frequencia"
          className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06]"
        >
          <div className="border-b border-slate-200/80 px-5 py-4 sm:px-6">
            <h3 className="text-base font-semibold text-slate-900">
              Histórico de Faltas e Justificativas
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Aulas em que o estudante teve ausência registrada
            </p>
          </div>

          {attendance.absences.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">
              Nenhuma falta registrada até o momento.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {attendance.absences.map((item) => (
                <li
                  key={`${item.lessonId}-${item.date}`}
                  className="space-y-1.5 px-5 py-3.5 sm:px-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-medium text-slate-700">
                      {formatIsoDateBr(item.date)} · {item.lessonNumber}ª aula
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        item.status === "FALTA"
                          ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                          : "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200"
                      }`}
                    >
                      {item.status === "FALTA" ? "Falta" : "Falta Justificada"}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-800">
                    {item.subject} ({item.classroomName})
                  </p>
                  <p className="line-clamp-2 text-xs text-slate-500">
                    Conteúdo: {item.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          id="ocorrencias"
          className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06]"
        >
          <div className="border-b border-slate-200/80 px-5 py-4 sm:px-6">
            <h3 className="text-base font-semibold text-slate-900">
              Histórico de Ocorrências
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Registros pedagógicos, disciplinares e elogios
            </p>
          </div>

          {occurrences.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">
              Nenhuma ocorrência registrada para este estudante.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {occurrences.map((item) => {
                const isPraise = item.type === "ELOGIO";

                return (
                  <li key={item.id} className="space-y-2 px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            isPraise
                              ? OCCURRENCE_PRAISE_STYLE
                              : "bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-200"
                          }`}
                        >
                          {OCCURRENCE_TYPE_LABELS[item.type]}
                        </span>
                        {!isPraise ? (
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${OCCURRENCE_SEVERITY_STYLES[item.severity]}`}
                          >
                            {OCCURRENCE_SEVERITY_LABELS[item.severity]}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${OCCURRENCE_STATUS_STYLES[item.status]}`}
                        >
                          {OCCURRENCE_STATUS_LABELS[item.status]}
                        </span>
                      </div>

                      <span className="font-mono text-[11px] text-slate-500">
                        {formatIsoDateBr(item.date)}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-700">
                      {item.description}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Registrado por {item.authorName}
                    </p>

                    {item.resolutionNote ? (
                      <div className="rounded-lg bg-emerald-50/70 px-3 py-2 text-xs text-emerald-950 ring-1 ring-inset ring-emerald-200">
                        <span className="font-semibold text-emerald-800">Encaminhamento: </span>
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
    </div>
  );
}
