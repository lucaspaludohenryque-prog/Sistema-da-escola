"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  CheckCheck,
  ClipboardCheck,
  History,
  Loader2,
  Save,
  Users,
} from "lucide-react";
import { SHIFT_LABELS } from "@/features/classrooms/constants";
import type { ApiErrorPayload, ClassroomSummary } from "@/features/classrooms/types";
import { Avatar } from "@/shared/components/Avatar";
import { ListRowsSkeleton } from "@/shared/components/Skeleton";
import { useToast } from "@/shared/components/ToastProvider";
import {
  ATTENDANCE_STATUS_META,
  LESSON_NUMBERS,
  LOW_ATTENDANCE_THRESHOLD,
  formatIsoDateBr,
  getTodayIsoDate,
} from "../constants";
import {
  ATTENDANCE_STATUSES,
  type AttendanceSheetData,
  type AttendanceStatus,
  type LessonHistoryItem,
} from "../types";
import { LessonHistoryList } from "./LessonHistoryList";

interface AttendanceViewProps {
  classrooms: ClassroomSummary[];
  initialClassroomId?: string;
  initialLessonNumber?: number;
  initialPrefillContent?: string;
}

type ActiveTab = "sheet" | "history";

export function AttendanceView({
  classrooms,
  initialClassroomId,
  initialLessonNumber,
  initialPrefillContent,
}: AttendanceViewProps): React.JSX.Element {
  const toast = useToast();
  const [selectedClassroomId, setSelectedClassroomId] = useState(() => {
    if (
      initialClassroomId &&
      classrooms.some((c) => c.id === initialClassroomId)
    ) {
      return initialClassroomId;
    }
    return classrooms[0]?.id ?? "";
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayIsoDate());
  const [lessonNumber, setLessonNumber] = useState<number>(
    () => initialLessonNumber ?? 1
  );
  const [prefillContent, setPrefillContent] = useState<string>(
    () => initialPrefillContent?.trim() ?? ""
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>("sheet");

  const [sheet, setSheet] = useState<AttendanceSheetData | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [content, setContent] = useState("");
  const [observations, setObservations] = useState("");
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetLoadError, setSheetLoadError] = useState<string | null>(null);

  const [history, setHistory] = useState<LessonHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const applySheetState = useCallback(
    (data: AttendanceSheetData) => {
      setSheet(data);
      const nextMap: Record<string, AttendanceStatus> = {};
      for (const student of data.students) {
        nextMap[student.studentId] = student.status;
      }
      setStatusMap(nextMap);
      if (data.lesson?.content) {
        setContent(data.lesson.content);
      } else if (prefillContent) {
        setContent(prefillContent);
        setPrefillContent("");
      } else {
        setContent("");
      }
      setObservations(data.lesson?.observations ?? "");
    },
    [prefillContent]
  );

  const fetchHistory = useCallback(async (classroomId: string) => {
    if (!classroomId) {
      setHistory([]);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/lessons?classroomId=${encodeURIComponent(classroomId)}`,
        { cache: "no-store" }
      );
      if (response.ok) {
        const payload = (await response.json()) as { lessons: LessonHistoryItem[] };
        setHistory(payload.lessons);
      }
    } catch {
      // Historico permanece no ultimo estado valido.
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedClassroomId) {
      return;
    }

    let isCancelled = false;

    async function loadSheet(): Promise<void> {
      setIsLoadingSheet(true);
      setSheetLoadError(null);
      setErrorMessage(null);

      try {
        const query = new URLSearchParams({
          classroomId: selectedClassroomId,
          date: selectedDate,
          lessonNumber: String(lessonNumber),
        });
        const response = await fetch(`/api/attendance?${query.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          let message = "Não foi possível carregar a chamada.";
          try {
            const payload = (await response.json()) as Partial<ApiErrorPayload>;
            if (payload.error) {
              message = payload.error;
            }
          } catch {
            // Mantem mensagem padrao.
          }
          if (!isCancelled) {
            setSheetLoadError(message);
          }
          return;
        }

        const data = (await response.json()) as AttendanceSheetData;
        if (!isCancelled) {
          applySheetState(data);
        }
      } catch {
        if (!isCancelled) {
          setSheetLoadError("Falha de conexão ao carregar a chamada.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSheet(false);
        }
      }
    }

    void loadSheet();

    return () => {
      isCancelled = true;
    };
  }, [selectedClassroomId, selectedDate, lessonNumber, applySheetState]);

  useEffect(() => {
    if (!selectedClassroomId) {
      return;
    }
    void fetchHistory(selectedClassroomId);
  }, [selectedClassroomId, fetchHistory]);

  const counters = useMemo(() => {
    let present = 0;
    let absent = 0;
    let justified = 0;

    if (sheet) {
      for (const student of sheet.students) {
        const current = statusMap[student.studentId] ?? student.status;
        if (current === "PRESENTE") present += 1;
        else if (current === "FALTA") absent += 1;
        else justified += 1;
      }
    }

    return { present, absent, justified };
  }, [sheet, statusMap]);

  function handleMarkAllPresent(): void {
    if (!sheet) return;
    const nextMap: Record<string, AttendanceStatus> = {};
    for (const student of sheet.students) {
      nextMap[student.studentId] = "PRESENTE";
    }
    setStatusMap(nextMap);
    setErrorMessage(null);
  }

  function handleStudentStatus(studentId: string, nextStatus: AttendanceStatus): void {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: nextStatus,
    }));
    setErrorMessage(null);
  }

  function handleSelectHistoryLesson(date: string, number: number): void {
    setSelectedDate(date);
    setLessonNumber(number);
    setActiveTab("sheet");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!sheet) return;

    const trimmedContent = content.trim();
    if (trimmedContent.length < 3) {
      const msg =
        "Preencha o Conteúdo Ministrado na Aula antes de salvar a chamada.";
      setErrorMessage(msg);
      toast.warning(msg);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const records = sheet.students.map((student) => ({
        studentId: student.studentId,
        status: statusMap[student.studentId] ?? student.status,
      }));

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          date: selectedDate,
          lessonNumber,
          content: trimmedContent,
          observations: observations.trim(),
          records,
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível salvar a chamada.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) {
            message = payload.error;
          }
        } catch {
          // Mantem mensagem padrao.
        }
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      const payload = (await response.json()) as { sheet: AttendanceSheetData };
      applySheetState(payload.sheet);
      await fetchHistory(selectedClassroomId);

      toast.success(
        `Chamada da ${lessonNumber}ª aula (${formatIsoDateBr(selectedDate)}) salva com sucesso.`,
        "Chamada registrada"
      );
    } catch {
      const msg = "Falha de conexão com o servidor. Tente salvar novamente.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  if (classrooms.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-200/80 bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
          <ClipboardCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h2 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Nenhuma turma disponível para chamada
        </h2>
        <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
          Cadastre ou vincule uma turma em Turmas para iniciar o registro diário de frequência e
          conteúdo.
        </p>
        <div className="mt-4">
          <Link
            href="/dashboard/turmas"
            className="inline-flex h-9 items-center rounded-lg bg-[var(--school-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--school-primary-hover)]"
          >
            Ir para Turmas
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
            Chamada e Diário de Aula
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Registre frequência diária e conteúdo ministrado por turma e aula.
          </p>
        </div>

        <div
          className="inline-flex w-fit rounded-lg border border-zinc-200/80 bg-zinc-100/90 p-0.5 dark:border-white/[0.08] dark:bg-[#1A1D21]"
          role="tablist"
          aria-label="Seções de chamada"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "sheet"}
            onClick={() => setActiveTab("sheet")}
            className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
              activeTab === "sheet"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-[#131518] dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <ClipboardCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>Chamada e Diário</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
              activeTab === "history"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-[#131518] dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <History className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span className="tabular-nums">Histórico ({history.length})</span>
          </button>
        </div>
      </header>

      {/* Barra superior de selecao */}
      <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_1fr_0.9fr]">
          <div className="space-y-1">
            <label
              htmlFor="attendance-classroom"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Turma
            </label>
            <select
              id="attendance-classroom"
              value={selectedClassroomId}
              onChange={(event) => setSelectedClassroomId(event.target.value)}
              className="block h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
            >
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} - {classroom.subject} ({SHIFT_LABELS[classroom.shift]} /{" "}
                  {classroom.year})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="attendance-date"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Data da aula
            </label>
            <input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(event) => {
                if (event.target.value) {
                  setSelectedDate(event.target.value);
                }
              }}
              className="block h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm tabular-nums text-zinc-900 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="attendance-lesson-number"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Nº da Aula
            </label>
            <select
              id="attendance-lesson-number"
              value={lessonNumber}
              onChange={(event) => setLessonNumber(Number(event.target.value))}
              className="block h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
            >
              {LESSON_NUMBERS.map((num) => (
                <option key={num} value={num}>
                  {num}ª aula
                </option>
              ))}
            </select>
          </div>
        </div>

        {sheet ? (
          <div className="mt-3 flex items-center justify-between border-t border-zinc-200/70 pt-3 dark:border-white/[0.07]">
            <span
              className={`inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums ${
                sheet.lesson
                  ? "border-blue-200/80 bg-blue-50/70 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
                  : "border-zinc-200/80 bg-zinc-50 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400"
              }`}
            >
              {sheet.lesson
                ? `Aula registrada em ${formatIsoDateBr(sheet.date)} (${sheet.lessonNumber}ª aula)`
                : `Nova chamada para ${formatIsoDateBr(sheet.date)} (${sheet.lessonNumber}ª aula)`}
            </span>
          </div>
        ) : null}
      </section>

      {activeTab === "history" ? (
        <LessonHistoryList
          lessons={history}
          isLoading={isLoadingHistory}
          activeDate={selectedDate}
          activeLessonNumber={lessonNumber}
          onSelectLesson={handleSelectHistoryLesson}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {errorMessage ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200/90 bg-red-50/70 px-4 py-3 text-sm text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
                strokeWidth={1.75}
              />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {sheetLoadError ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200/90 bg-red-50/70 px-4 py-3 text-sm text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" strokeWidth={1.75} />
              <span>{sheetLoadError}</span>
            </div>
          ) : null}

          {/* Lista de frequencia */}
          <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
            <div className="flex flex-col gap-3 border-b border-zinc-200/80 bg-zinc-50/70 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08] dark:bg-white/[0.02]">
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Lista de Frequência
                </h3>
                <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-medium tabular-nums">
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Presentes: {counters.present}
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    Faltas: {counters.absent}
                  </span>
                  <span className="text-amber-700 dark:text-amber-400">
                    Justificadas: {counters.justified}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleMarkAllPresent}
                disabled={isLoadingSheet || !sheet || sheet.students.length === 0}
                className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50/70 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:border-emerald-500/35 dark:hover:bg-emerald-500/12 dark:hover:text-emerald-300"
              >
                <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span>Marcar Todos Presentes</span>
              </button>
            </div>

            {isLoadingSheet ? (
              <ListRowsSkeleton rows={5} />
            ) : !sheet || sheet.students.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
                  <Users className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Nenhum aluno ativo nesta turma
                </h3>
                <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
                  Adicione alunos ativos na página da turma para realizar a chamada.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-200/70 dark:divide-white/[0.06]">
                {sheet.students.map((student, index) => {
                  const currentStatus = statusMap[student.studentId] ?? student.status;
                  const isLowAttendance =
                    student.attendanceRate !== null &&
                    student.attendanceRate < LOW_ATTENDANCE_THRESHOLD;

                  return (
                    <li
                      key={student.studentId}
                      className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-zinc-50/80 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:hover:bg-white/[0.02]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-6 shrink-0 font-mono text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <Avatar name={student.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {student.name}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                              {student.registration}
                            </span>
                            {student.attendanceRate === null ? (
                              <span className="inline-flex items-center rounded-md border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400">
                                Sem histórico
                              </span>
                            ) : (
                              <span
                                title={`${student.presentCount} presenças, ${student.absentCount} faltas, ${student.justifiedCount} justificadas em ${student.totalRecordedLessons} aulas`}
                                className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums ${
                                  isLowAttendance
                                    ? "border-red-200/80 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                                    : "border-zinc-200/80 bg-zinc-50 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300"
                                }`}
                              >
                                Freq.: {student.attendanceRate}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className="flex shrink-0 items-center gap-1.5 pl-9 sm:pl-0"
                        role="group"
                        aria-label={`Frequência de ${student.name}`}
                      >
                        {ATTENDANCE_STATUSES.map((statusOption) => {
                          const meta = ATTENDANCE_STATUS_META[statusOption];
                          const isSelected = currentStatus === statusOption;

                          return (
                            <button
                              key={statusOption}
                              type="button"
                              onClick={() =>
                                handleStudentStatus(student.studentId, statusOption)
                              }
                              aria-pressed={isSelected}
                              aria-label={`${meta.label} para ${student.name}`}
                              title={meta.label}
                              className={`h-8 min-w-[42px] cursor-pointer rounded-lg px-2.5 text-xs font-semibold transition-colors duration-100 ${
                                isSelected ? meta.activeClass : meta.idleClass
                              }`}
                            >
                              {meta.shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Diario de Conteudo */}
          <section className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
            <div className="mb-4 flex items-center gap-2 border-b border-zinc-200/70 pb-3 dark:border-white/[0.07]">
              <BookOpen
                className="h-4 w-4 text-zinc-400 dark:text-zinc-500"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Diário de Conteúdo
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="lesson-content"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Conteúdo Ministrado na Aula{" "}
                  <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <textarea
                  id="lesson-content"
                  rows={3}
                  required
                  disabled={isSaving || isLoadingSheet}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Descreva o conteúdo trabalhado, exercícios realizados ou avaliação aplicada nesta aula..."
                  className="block w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="lesson-observations"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Observações da Aula{" "}
                  <span className="font-normal text-zinc-400 dark:text-zinc-500">
                    (opcional)
                  </span>
                </label>
                <textarea
                  id="lesson-observations"
                  rows={2}
                  disabled={isSaving || isLoadingSheet}
                  value={observations}
                  onChange={(event) => setObservations(event.target.value)}
                  placeholder="Anotações pedagógicas, tarefas de casa ou avisos para a próxima aula..."
                  className="block w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-zinc-200/70 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.07]">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Os registros de presença e o conteúdo são gravados juntos na mesma transação.
              </p>

              <button
                type="submit"
                disabled={isSaving || isLoadingSheet || !sheet}
                className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--school-primary-hover)] disabled:cursor-not-allowed disabled:opacity-65"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    <span>Salvar Chamada</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </form>
      )}
    </div>
  );
}
