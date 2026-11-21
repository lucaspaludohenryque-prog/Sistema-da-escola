"use client";
/* eslint-disable @next/next/no-img-element -- Brasao da escola na versao imprimivel da Ata A4. */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpenCheck,
  FileWarning,
  GraduationCap,
  Loader2,
  Printer,
  Save,
  ScrollText,
  Users,
} from "lucide-react";
import {
  LOW_ATTENDANCE_THRESHOLD,
  formatIsoDateBr,
  getTodayIsoDate,
} from "@/features/attendance/constants";
import { SHIFT_LABELS } from "@/features/classrooms/constants";
import type { ApiErrorPayload, ClassroomSummary } from "@/features/classrooms/types";
import {
  PASSING_GRADE_THRESHOLD,
  TERM_LABELS,
  formatScoreBr,
} from "@/features/grades/constants";
import { ACADEMIC_TERMS, type AcademicTerm } from "@/features/grades/types";
import { Avatar } from "@/shared/components/Avatar";
import { DashboardPageSkeleton } from "@/shared/components/Skeleton";
import { useToast } from "@/shared/components/ToastProvider";
import type { ClassCouncilPayload } from "../types";

interface CouncilViewProps {
  classrooms: ClassroomSummary[];
}

const INPUT_CLASS =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400";

export function CouncilView({
  classrooms,
}: CouncilViewProps): React.JSX.Element {
  const toast = useToast();
  const [selectedClassroomId, setSelectedClassroomId] = useState(
    () => classrooms[0]?.id ?? ""
  );
  const [selectedTerm, setSelectedTerm] = useState<AcademicTerm>(1);
  const [data, setData] = useState<ClassCouncilPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [date, setDate] = useState(() => getTodayIsoDate());
  const [summary, setSummary] = useState("");
  const [decisions, setDecisions] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchCouncil = useCallback(
    async (classroomId: string, term: AcademicTerm) => {
      if (!classroomId) return;
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          classroomId,
          term: String(term),
        });
        const response = await fetch(`/api/council?${params.toString()}`, {
          cache: "no-store",
        });
        if (response.ok) {
          const payload = (await response.json()) as ClassCouncilPayload;
          setData(payload);
          setDate(payload.minute?.date ?? getTodayIsoDate());
          setSummary(payload.minute?.summary ?? "");
          setDecisions(payload.minute?.decisions ?? "");
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedClassroomId) return;
    void fetchCouncil(selectedClassroomId, selectedTerm);
  }, [selectedClassroomId, selectedTerm, fetchCouncil]);

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (summary.trim().length < 5 || decisions.trim().length < 5) {
      toast.warning(
        "Preencha o Parecer Geral e as Decisões/Encaminhamentos (mínimo 5 caracteres cada)."
      );
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          term: selectedTerm,
          date,
          summary: summary.trim(),
          decisions: decisions.trim(),
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível salvar a ata do conselho.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await response.json()) as ClassCouncilPayload;
      setData(payload);
      toast.success(
        `Ata do ${TERM_LABELS[selectedTerm]} salva com sucesso.`,
        "Conselho de Classe"
      );
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setIsSaving(false);
    }
  }

  if (classrooms.length === 0) {
    return (
      <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <ScrollText className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          Nenhuma turma disponível para Conselho de Classe
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
          Cadastre ou vincule uma turma em Turmas para elaborar atas do conselho.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles de tela (ocultos na impressao) */}
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800 print:hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-[1.6fr_1fr]">
            <div className="space-y-1.5">
              <label
                htmlFor="council-classroom"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Turma
              </label>
              <select
                id="council-classroom"
                value={selectedClassroomId}
                onChange={(e) => setSelectedClassroomId(e.target.value)}
                className={INPUT_CLASS}
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.subject} ({SHIFT_LABELS[c.shift]} / {c.year})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="council-term"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Trimestre
              </label>
              <select
                id="council-term"
                value={selectedTerm}
                onChange={(e) =>
                  setSelectedTerm(Number(e.target.value) as AcademicTerm)
                }
                className={INPUT_CLASS}
              >
                {ACADEMIC_TERMS.map((t) => (
                  <option key={t} value={t}>
                    {TERM_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            disabled={!data || isLoading}
            onClick={() => window.print()}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Printer className="h-4 w-4" strokeWidth={1.75} />
            <span>Imprimir / Salvar Ata em PDF</span>
          </button>
        </div>
      </section>

      {isLoading || !data ? (
        <div className="print:hidden">
          <DashboardPageSkeleton />
        </div>
      ) : (
        <>
          {/* Visao interativa de tela (oculta na impressao) */}
          <div className="space-y-6 print:hidden">
            {/* Resumo automatico dos numeros da turma */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Alunos Ativos
                    </p>
                    <p className="mt-1 font-mono text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {data.metrics.totalStudents}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[var(--school-primary)] ring-1 ring-inset ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30">
                    <Users className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                  {data.metrics.lessonsCount} aulas registradas na turma
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Abaixo da Média (&lt; 6,0)
                    </p>
                    <p className="mt-1 font-mono text-3xl font-bold text-amber-700 dark:text-amber-300">
                      {data.metrics.belowAverageCount}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30">
                    <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                  Considerando recuperação do {TERM_LABELS[selectedTerm]}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Frequência &lt; 75%
                    </p>
                    <p className="mt-1 font-mono text-3xl font-bold text-red-700 dark:text-red-400">
                      {data.metrics.lowAttendanceCount}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30">
                    <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                  Abaixo do mínimo legal de presença
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Ocorrências da Turma
                    </p>
                    <p className="mt-1 font-mono text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {data.metrics.occurrencesCount}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                    <FileWarning className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                  Registros disciplinares e pedagógicos
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
              {/* Editor da Ata */}
              <form
                onSubmit={handleSave}
                className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-4 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ScrollText
                      className="h-5 w-5 text-[var(--school-primary)] dark:text-blue-400"
                      strokeWidth={1.75}
                    />
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Ata do Conselho de Classe ({TERM_LABELS[selectedTerm]})
                      </h2>
                      {data.minute ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Última atualização por {data.minute.authorName}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Nenhuma ata registrada ainda para este trimestre
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="max-w-xs space-y-1.5">
                    <label
                      htmlFor="council-date"
                      className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                    >
                      Data da Reunião
                    </label>
                    <input
                      id="council-date"
                      type="date"
                      required
                      disabled={isSaving}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="council-summary"
                      className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                    >
                      Parecer Geral da Turma
                    </label>
                    <textarea
                      id="council-summary"
                      rows={5}
                      required
                      disabled={isSaving}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Descreva o perfil pedagógico da turma, avanços, dificuldades coletivas, participação e disciplina no trimestre..."
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="council-decisions"
                      className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                    >
                      Decisões e Encaminhamentos Pedagógicos
                    </label>
                    <textarea
                      id="council-decisions"
                      rows={5}
                      required
                      disabled={isSaving}
                      value={decisions}
                      onChange={(e) => setDecisions(e.target.value)}
                      placeholder="Registre convocações de responsáveis, planos de recuperação, reforço escolar e encaminhamentos definidos em conselho..."
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end border-t border-slate-200/80 pt-5 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--school-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98] disabled:opacity-70"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Salvando Ata...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" strokeWidth={1.75} />
                        <span>Salvar Ata</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Alunos em ponto de atencao */}
              <section className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
                <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Estudantes em Ponto de Atenção ({data.attentionStudents.length})
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Média final do trimestre &lt; 6,0 ou frequência &lt; 75%
                  </p>
                </div>

                {data.attentionStudents.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    Nenhum estudante da turma em alerta neste trimestre.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.attentionStudents.map((st) => (
                      <li
                        key={st.studentId}
                        className="flex items-center justify-between gap-3 px-5 py-3.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar name={st.name} size="sm" />
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/alunos/${st.studentId}/ficha`}
                              className="block truncate text-sm font-semibold text-slate-900 hover:text-[var(--school-primary)] hover:underline dark:text-slate-100 dark:hover:text-blue-400"
                            >
                              {st.name}
                            </Link>
                            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {st.registration}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {st.termFinalAverage !== null &&
                          st.termFinalAverage < PASSING_GRADE_THRESHOLD ? (
                            <span className="rounded bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30">
                              Média {formatScoreBr(st.termFinalAverage)}
                            </span>
                          ) : null}
                          {st.attendanceRate !== null &&
                          st.attendanceRate < LOW_ATTENDANCE_THRESHOLD ? (
                            <span className="rounded bg-red-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30">
                              Freq. {st.attendanceRate}%
                            </span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>

          {/* Documento A4 oficial para impressao / PDF (sempre fundo branco e texto escuro) */}
          <article className="rco-print-sheet hidden bg-white text-slate-900 print:block">
            <header className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-start gap-3">
                {data.school.logoUrl ? (
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
                    <img
                      src={data.school.logoUrl}
                      alt={`Logo ${data.school.name}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-900 bg-slate-900 text-white">
                    <BookOpenCheck className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase">
                    {data.school.name}
                  </p>
                  <h1 className="text-xl font-bold text-slate-900">
                    Ata de Conselho de Classe - {TERM_LABELS[selectedTerm]}
                  </h1>
                  <p className="text-xs text-slate-600">
                    {data.classroom.name} - {data.classroom.subject} (
                    {SHIFT_LABELS[data.classroom.shift]}) · Ano Letivo{" "}
                    {data.classroom.year}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-slate-600">
                <p className="font-semibold text-slate-900">
                  Data: {formatIsoDateBr(date)}
                </p>
                <p>Prof. {data.classroom.teacherName}</p>
              </div>
            </header>

            <section className="print-avoid-break mt-6">
              <h2 className="border-b border-slate-300 pb-1 text-xs font-bold uppercase">
                1. Indicadores Consolidados da Turma
              </h2>
              <div className="mt-3 grid grid-cols-4 gap-3 text-center text-xs">
                <div className="rounded border border-slate-300 p-2.5">
                  <p className="text-slate-600">Alunos Ativos</p>
                  <p className="mt-1 font-mono text-base font-bold">
                    {data.metrics.totalStudents}
                  </p>
                </div>
                <div className="rounded border border-slate-300 p-2.5">
                  <p className="text-slate-600">Abaixo da Média</p>
                  <p className="mt-1 font-mono text-base font-bold">
                    {data.metrics.belowAverageCount}
                  </p>
                </div>
                <div className="rounded border border-slate-300 p-2.5">
                  <p className="text-slate-600">Freq. &lt; 75%</p>
                  <p className="mt-1 font-mono text-base font-bold">
                    {data.metrics.lowAttendanceCount}
                  </p>
                </div>
                <div className="rounded border border-slate-300 p-2.5">
                  <p className="text-slate-600">Ocorrências</p>
                  <p className="mt-1 font-mono text-base font-bold">
                    {data.metrics.occurrencesCount}
                  </p>
                </div>
              </div>
            </section>

            {data.attentionStudents.length > 0 ? (
              <section className="print-avoid-break mt-6">
                <h2 className="border-b border-slate-300 pb-1 text-xs font-bold uppercase">
                  2. Estudantes em Acompanhamento Prioritário
                </h2>
                <table className="mt-2 w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="py-1.5 font-semibold">Estudante</th>
                      <th className="py-1.5 font-semibold">Matrícula</th>
                      <th className="py-1.5 text-center font-semibold">Média Final</th>
                      <th className="py-1.5 text-center font-semibold">Frequência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.attentionStudents.map((st) => (
                      <tr key={st.studentId}>
                        <td className="py-1.5 font-medium">{st.name}</td>
                        <td className="py-1.5 font-mono">{st.registration}</td>
                        <td className="py-1.5 text-center font-mono">
                          {formatScoreBr(st.termFinalAverage)}
                        </td>
                        <td className="py-1.5 text-center font-mono">
                          {st.attendanceRate !== null ? `${st.attendanceRate}%` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}

            <section className="print-avoid-break mt-6">
              <h2 className="border-b border-slate-300 pb-1 text-xs font-bold uppercase">
                {data.attentionStudents.length > 0 ? "3." : "2."} Parecer Geral da Turma
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
                {summary || "(Sem parecer registrado)"}
              </p>
            </section>

            <section className="print-avoid-break mt-6">
              <h2 className="border-b border-slate-300 pb-1 text-xs font-bold uppercase">
                {data.attentionStudents.length > 0 ? "4." : "3."} Decisões e Encaminhamentos
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
                {decisions || "(Sem encaminhamentos registrados)"}
              </p>
            </section>

            <footer className="print-avoid-break mt-14 grid grid-cols-3 gap-6 border-t border-slate-300 pt-8 text-center text-xs text-slate-700">
              <div>
                <div className="mx-auto mb-2 w-44 border-b border-slate-500" />
                <p className="font-semibold text-slate-900">
                  {data.classroom.teacherName}
                </p>
                <p>Professor(a)</p>
              </div>
              <div>
                <div className="mx-auto mb-2 w-44 border-b border-slate-500" />
                <p className="font-semibold text-slate-900">Coordenação Pedagógica</p>
                <p>Assinatura</p>
              </div>
              <div>
                <div className="mx-auto mb-2 w-44 border-b border-slate-500" />
                <p className="font-semibold text-slate-900">Direção Escolar</p>
                <p>Assinatura / Carimbo</p>
              </div>
            </footer>
          </article>
        </>
      )}
    </div>
  );
}
