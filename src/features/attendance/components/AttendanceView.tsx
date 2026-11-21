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
      <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <ClipboardCheck className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          Nenhuma turma disponível para chamada
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
          Cadastre ou vincule uma turma em Turmas para iniciar o registro diário de frequência e
          conteúdo.
        </p>
        <div className="mt-5">
          <Link
            href="/dashboard/turmas"
            className="inline-flex items-center rounded-lg bg-[var(--school-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--school-primary-hover)]"
          >
            Ir para Turmas
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra superior de selecao */}
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.6fr_1fr_0.9fr]">
          <div className="space-y-1.5">
            <label
              htmlFor="attendance-classroom"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Turma
            </label>
            <select
              id="attendance-classroom"
              value={selectedClassroomId}
              onChange={(event) => setSelectedClassroomId(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} - {classroom.subject} ({SHIFT_LABELS[classroom.shift]} /{" "}
                  {classroom.year})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="attendance-date"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
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
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="attendance-lesson-number"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Nº da Aula
            </label>
            <select
              id="attendance-lesson-number"
              value={lessonNumber}
              onChange={(event) => setLessonNumber(Number(event.target.value))}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {LESSON_NUMBERS.map((num) => (
                <option key={num} value={num}>
                  {num}ª aula
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div
            className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
            role="tablist"
            aria-label="Seções de chamada"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "sheet"}
              onClick={() => setActiveTab("sheet")}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "sheet"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
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
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "history"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <History className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Histórico ({history.length})</span>
            </button>
          </div>

          {sheet ? (
            <span
              className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-medium ${
                sheet.lesson
                  ? "bg-blue-50 text-[var(--school-primary)] ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30"
                  : "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
              }`}
            >
              {sheet.lesson
                ? `Aula já registrada em ${formatIsoDateBr(sheet.date)} (${sheet.lessonNumber}ª aula)`
                : `Nova chamada para ${formatIsoDateBr(sheet.date)} (${sheet.lessonNumber}ª aula)`}
            </span>
          ) : null}
        </div>
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
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {errorMessage ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-300"
                strokeWidth={1.75}
              />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {sheetLoadError ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-300" strokeWidth={1.75} />
              <span>{sheetLoadError}</span>
            </div>
          ) : null}

          {/* Lista de frequencia */}
          <section className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex flex-col gap-3 border-b border-slate-200/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Lista de Frequência
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Presentes: {counters.present}
                  </span>
                  <span className="text-red-700 dark:text-red-400">
                    Faltas: {counters.absent}
                  </span>
                  <span className="text-amber-800 dark:text-amber-300">
                    Justificadas: {counters.justified}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleMarkAllPresent}
                disabled={isLoadingSheet || !sheet || sheet.students.length === 0}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300"
              >
                <CheckCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                <span>Marcar Todos Presentes</span>
              </button>
            </div>

            {isLoadingSheet ? (
              <ListRowsSkeleton rows={5} />
            ) : !sheet || sheet.students.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <Users className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                  Nenhum aluno ativo nesta turma
                </h3>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
                  Adicione alunos ativos na página da turma para realizar a chamada.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {sheet.students.map((student, index) => {
                  const currentStatus = statusMap[student.studentId] ?? student.status;
                  const isLowAttendance =
                    student.attendanceRate !== null &&
                    student.attendanceRate < LOW_ATTENDANCE_THRESHOLD;

                  return (
                    <li
                      key={student.studentId}
                      className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-6 shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <Avatar name={student.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {student.name}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                              {student.registration}
                            </span>
                            {student.attendanceRate === null ? (
                              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                Sem histórico
                              </span>
                            ) : (
                              <span
                                title={`${student.presentCount} presenças, ${student.absentCount} faltas, ${student.justifiedCount} justificadas em ${student.totalRecordedLessons} aulas`}
                                className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold ${
                                  isLowAttendance
                                    ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30"
                                    : "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                                }`}
                              >
                                Freq.: {student.attendanceRate}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className="flex shrink-0 items-center gap-2 pl-9 sm:pl-0"
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
                              className={`min-w-[46px] cursor-pointer rounded-lg px-3 py-2 text-xs font-bold transition-[background-color,color,transform] duration-100 active:scale-[0.96] ${
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
          <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen
                className="h-5 w-5 text-[var(--school-primary)] dark:text-blue-400"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Diário de Conteúdo
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="lesson-content"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  Conteúdo Ministrado na Aula{" "}
                  <span className="text-red-700 dark:text-red-400">*</span>
                </label>
                <textarea
                  id="lesson-content"
                  rows={3}
                  required
                  disabled={isSaving || isLoadingSheet}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Descreva o conteúdo trabalhado, exercícios realizados ou avaliação aplicada nesta aula..."
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:disabled:bg-slate-800/50"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="lesson-observations"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  Observações da Aula{" "}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
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
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:disabled:bg-slate-800/50"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200/80 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Os registros de presença e o conteúdo são gravados juntos na mesma transação.
              </p>

              <button
                type="submit"
                disabled={isSaving || isLoadingSheet || !sheet}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--school-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                    <span>Salvando Chamada...</span>
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
