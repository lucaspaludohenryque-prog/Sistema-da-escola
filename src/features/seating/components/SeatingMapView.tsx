"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Eraser,
  LayoutGrid,
  Loader2,
  Save,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  ATTENDANCE_STATUS_META,
  LESSON_NUMBERS,
  LOW_ATTENDANCE_THRESHOLD,
  getTodayIsoDate,
} from "@/features/attendance/constants";
import type {
  AttendanceSheetData,
  AttendanceStatus,
} from "@/features/attendance/types";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import { PASSING_GRADE_THRESHOLD, formatScoreBr } from "@/features/grades/constants";
import { Avatar } from "@/shared/components/Avatar";
import { Skeleton } from "@/shared/components/Skeleton";
import { useToast } from "@/shared/components/ToastProvider";
import type {
  ClassroomSeatingData,
  ClassroomSeatingOption,
  SeatingStudentInfo,
} from "../types";

interface SeatingMapViewProps {
  classrooms: ClassroomSeatingOption[];
  initialData: ClassroomSeatingData | null;
}

type ViewMode = "edit" | "attendance";

const STATUS_CYCLE: Record<AttendanceStatus, AttendanceStatus> = {
  PRESENTE: "FALTA",
  FALTA: "JUSTIFICADA",
  JUSTIFICADA: "PRESENTE",
};

function getShortStudentName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return fullName;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function SeatingMapView({
  classrooms,
  initialData,
}: SeatingMapViewProps): React.JSX.Element {
  const toast = useToast();
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(
    initialData?.classroomId ?? classrooms[0]?.id ?? ""
  );
  const [mode, setMode] = useState<ViewMode>("edit");

  // Estado do mapa
  const [seatRows, setSeatRows] = useState<number>(initialData?.seatRows ?? 5);
  const [seatCols, setSeatCols] = useState<number>(initialData?.seatCols ?? 6);
  const [allStudents, setAllStudents] = useState<SeatingStudentInfo[]>(
    initialData?.allStudents ?? []
  );
  // key: "row:col" -> studentId
  const [seatMap, setSeatMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const a of initialData?.assignments ?? []) {
      map[`${a.row}:${a.col}`] = a.studentId;
    }
    return map;
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [isSavingMap, setIsSavingMap] = useState(false);

  // Estado do modo Chamada Visual
  const [attendanceDate, setAttendanceDate] = useState<string>(getTodayIsoDate);
  const [lessonNumber, setLessonNumber] = useState<number>(1);
  const [lessonContent, setLessonContent] = useState<string>("");
  const [attendanceByStudent, setAttendanceByStudent] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  const studentById = useMemo(
    () => new Map(allStudents.map((s) => [s.id, s])),
    [allStudents]
  );

  const seatedStudentIds = useMemo(
    () => new Set(Object.values(seatMap)),
    [seatMap]
  );

  const unassignedStudents = useMemo(
    () => allStudents.filter((s) => !seatedStudentIds.has(s.id)),
    [allStudents, seatedStudentIds]
  );

  const loadSeating = useCallback(
    async (classroomId: string): Promise<void> => {
      if (!classroomId) return;
      setIsLoadingMap(true);
      setSelectedStudentId(null);
      try {
        const res = await fetch(`/api/classrooms/${classroomId}/seating`, {
          cache: "no-store",
        });
        if (!res.ok) {
          toast.error("Não foi possível carregar o mapa desta turma.");
          return;
        }
        const data = (await res.json()) as ClassroomSeatingData;
        setSeatRows(data.seatRows);
        setSeatCols(data.seatCols);
        setAllStudents(data.allStudents);
        const nextMap: Record<string, string> = {};
        for (const a of data.assignments) {
          nextMap[`${a.row}:${a.col}`] = a.studentId;
        }
        setSeatMap(nextMap);
      } catch {
        toast.error("Erro de conexão ao carregar o mapa de sala.");
      } finally {
        setIsLoadingMap(false);
      }
    },
    [toast]
  );

  const loadAttendanceSheet = useCallback(
    async (classroomId: string, date: string, lesson: number): Promise<void> => {
      if (!classroomId) return;
      setIsLoadingAttendance(true);
      try {
        const res = await fetch(
          `/api/attendance?classroomId=${encodeURIComponent(classroomId)}&date=${encodeURIComponent(date)}&lessonNumber=${lesson}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          toast.error("Não foi possível carregar a chamada para esta aula.");
          return;
        }
        const sheet = (await res.json()) as AttendanceSheetData;
        setLessonContent(sheet.lesson?.content ?? "");
        const statuses: Record<string, AttendanceStatus> = {};
        for (const row of sheet.students) {
          statuses[row.studentId] = row.status;
        }
        setAttendanceByStudent(statuses);
      } catch {
        toast.error("Erro de conexão ao carregar os dados da chamada.");
      } finally {
        setIsLoadingAttendance(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (mode === "attendance" && selectedClassroomId) {
      void loadAttendanceSheet(selectedClassroomId, attendanceDate, lessonNumber);
    }
  }, [mode, selectedClassroomId, attendanceDate, lessonNumber, loadAttendanceSheet]);

  function handleClassroomChange(nextId: string): void {
    setSelectedClassroomId(nextId);
    void loadSeating(nextId);
  }

  function handleDimensionChange(nextRows: number, nextCols: number): void {
    setSeatRows(nextRows);
    setSeatCols(nextCols);
    // Remove carteiras que ficarem fora das novas dimensoes
    setSeatMap((prev) => {
      const next: Record<string, string> = {};
      for (const [key, studentId] of Object.entries(prev)) {
        const [rStr, cStr] = key.split(":");
        const r = Number(rStr);
        const c = Number(cStr);
        if (r < nextRows && c < nextCols) {
          next[key] = studentId;
        }
      }
      return next;
    });
  }

  function handleAutoDistribute(): void {
    const next: Record<string, string> = {};
    let idx = 0;
    for (let r = 0; r < seatRows; r += 1) {
      for (let c = 0; c < seatCols; c += 1) {
        const student = allStudents[idx];
        if (!student) break;
        next[`${r}:${c}`] = student.id;
        idx += 1;
      }
    }
    setSeatMap(next);
    setSelectedStudentId(null);
    if (idx < allStudents.length) {
      toast.warning(
        `${idx} de ${allStudents.length} alunos alocados. Aumente fileiras ou colunas para acomodar todos.`
      );
    } else {
      toast.info("Estudantes distribuídos em ordem alfabética. Clique em Salvar Mapa.");
    }
  }

  function handleClearMap(): void {
    setSeatMap({});
    setSelectedStudentId(null);
  }

  function findSeatKeyByStudent(
    map: Record<string, string>,
    studentId: string
  ): string | null {
    for (const [key, sid] of Object.entries(map)) {
      if (sid === studentId) return key;
    }
    return null;
  }

  function handleSeatClick(row: number, col: number): void {
    const targetKey = `${row}:${col}`;
    const occupantId = seatMap[targetKey] ?? null;

    if (mode === "attendance") {
      if (!occupantId) return;
      setAttendanceByStudent((prev) => {
        const current = prev[occupantId] ?? "PRESENTE";
        return { ...prev, [occupantId]: STATUS_CYCLE[current] };
      });
      return;
    }

    // Modo edicao
    if (!selectedStudentId) {
      if (occupantId) {
        setSelectedStudentId(occupantId);
      }
      return;
    }

    if (selectedStudentId === occupantId) {
      setSelectedStudentId(null);
      return;
    }

    setSeatMap((prev) => {
      const next = { ...prev };
      const sourceKey = findSeatKeyByStudent(prev, selectedStudentId);

      if (sourceKey) {
        delete next[sourceKey];
      }

      if (occupantId && sourceKey) {
        // Troca instantanea entre duas carteiras ocupadas
        next[sourceKey] = occupantId;
        next[targetKey] = selectedStudentId;
      } else {
        // Move para carteira vazia ou substitui ocupante (enviando o anterior para sem lugar)
        next[targetKey] = selectedStudentId;
      }

      return next;
    });

    setSelectedStudentId(null);
  }

  function handleRemoveFromSeat(row: number, col: number): void {
    const key = `${row}:${col}`;
    const occupantId = seatMap[key];
    setSeatMap((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (occupantId && selectedStudentId === occupantId) {
      setSelectedStudentId(null);
    }
  }

  async function handleSaveMap(): Promise<void> {
    if (!selectedClassroomId || isSavingMap) return;
    setIsSavingMap(true);
    try {
      const assignments = Object.entries(seatMap).map(([key, studentId]) => {
        const [rStr, cStr] = key.split(":");
        return {
          studentId,
          row: Number(rStr),
          col: Number(cStr),
        };
      });

      const res = await fetch(`/api/classrooms/${selectedClassroomId}/seating`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatRows, seatCols, assignments }),
      });

      if (!res.ok) {
        let message = "Não foi possível salvar o mapa de sala.";
        try {
          const payload = (await res.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      toast.success("Mapa de sala salvo com sucesso.", "Espelho de Classe");
    } catch {
      toast.error("Falha de conexão ao salvar o mapa.");
    } finally {
      setIsSavingMap(false);
    }
  }

  async function handleSaveVisualAttendance(): Promise<void> {
    if (!selectedClassroomId || isSavingAttendance) return;

    const trimmedContent = lessonContent.trim();
    if (trimmedContent.length < 3) {
      toast.warning("Informe o conteúdo ministrado (ao menos 3 caracteres) para salvar a chamada.");
      return;
    }

    setIsSavingAttendance(true);
    try {
      const records = allStudents.map((student) => ({
        studentId: student.id,
        status: attendanceByStudent[student.id] ?? "PRESENTE",
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          date: attendanceDate,
          lessonNumber,
          content: trimmedContent,
          observations: "",
          records,
        }),
      });

      if (!res.ok) {
        let message = "Não foi possível salvar a chamada visual.";
        try {
          const payload = (await res.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      toast.success(
        "Chamada salva pelo mapa de sala. Avisos automáticos disparados em caso de falta.",
        "Chamada registrada"
      );
      void loadSeating(selectedClassroomId);
    } catch {
      toast.error("Falha de conexão ao salvar a chamada.");
    } finally {
      setIsSavingAttendance(false);
    }
  }

  const attendanceSummary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let justified = 0;
    for (const st of allStudents) {
      const status = attendanceByStudent[st.id] ?? "PRESENTE";
      if (status === "PRESENTE") present += 1;
      else if (status === "FALTA") absent += 1;
      else justified += 1;
    }
    return { present, absent, justified };
  }, [allStudents, attendanceByStudent]);

  if (classrooms.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <LayoutGrid className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
          Nenhuma turma disponível para mapa de sala
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Cadastre ou vincule uma turma primeiro para organizar o espelho de classe.
        </p>
      </section>
    );
  }

  const selectedStudentObj = selectedStudentId
    ? studentById.get(selectedStudentId) ?? null
    : null;

  return (
    <div className="space-y-5">
      {/* Barra superior de controle e alternancia de modo */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-ambient)] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[220px] flex-1 sm:flex-initial">
              <label
                htmlFor="seating-classroom"
                className="mb-1 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
              >
                Turma
              </label>
              <select
                id="seating-classroom"
                value={selectedClassroomId}
                onChange={(e) => handleClassroomChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.subject} ({c.studentCount} alunos)
                  </option>
                ))}
              </select>
            </div>

            {mode === "edit" ? (
              <div className="flex items-end gap-2">
                <div>
                  <label
                    htmlFor="seat-rows"
                    className="mb-1 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                  >
                    Fileiras
                  </label>
                  <select
                    id="seat-rows"
                    value={seatRows}
                    onChange={(e) =>
                      handleDimensionChange(Number(e.target.value), seatCols)
                    }
                    className="rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="pb-2 text-xs font-semibold text-slate-400">×</span>
                <div>
                  <label
                    htmlFor="seat-cols"
                    className="mb-1 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
                  >
                    Colunas
                  </label>
                  <select
                    id="seat-cols"
                    value={seatCols}
                    onChange={(e) =>
                      handleDimensionChange(seatRows, Number(e.target.value))
                    }
                    className="rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
          </div>

          {/* Alternador Edicao <-> Chamada Visual */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode("edit");
                setSelectedStudentId(null);
              }}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === "edit"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Modo Edição do Mapa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("attendance");
                setSelectedStudentId(null);
              }}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === "attendance"
                  ? "bg-[var(--school-primary)] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              <ClipboardCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Modo Chamada Visual</span>
            </button>
          </div>
        </div>

        {/* Barra de acoes conforme o modo */}
        {mode === "edit" ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAutoDistribute}
                disabled={isLoadingMap || allStudents.length === 0}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span>Distribuição Automática</span>
              </button>
              <button
                type="button"
                onClick={handleClearMap}
                disabled={isLoadingMap || Object.keys(seatMap).length === 0}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-red-500/15 dark:hover:text-red-300"
              >
                <Eraser className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span>Limpar Mapa</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveMap}
              disabled={isSavingMap || isLoadingMap}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--school-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98] disabled:opacity-60"
            >
              {isSavingMap ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              )}
              <span>{isSavingMap ? "Salvando..." : "Salvar Mapa"}</span>
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-12 dark:border-slate-800">
            <div className="sm:col-span-3">
              <label
                htmlFor="visual-att-date"
                className="mb-1 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
              >
                Data da Aula
              </label>
              <input
                id="visual-att-date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="visual-att-lesson"
                className="mb-1 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
              >
                Nº Aula
              </label>
              <select
                id="visual-att-lesson"
                value={lessonNumber}
                onChange={(e) => setLessonNumber(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {LESSON_NUMBERS.map((n) => (
                  <option key={n} value={n}>
                    {n}ª aula
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="visual-att-content"
                className="mb-1 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
              >
                Conteúdo Ministrado
              </label>
              <input
                id="visual-att-content"
                type="text"
                value={lessonContent}
                onChange={(e) => setLessonContent(e.target.value)}
                placeholder="Ex.: Equações do 2º grau - revisão"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex items-end sm:col-span-3">
              <button
                type="button"
                onClick={handleSaveVisualAttendance}
                disabled={isSavingAttendance || isLoadingAttendance || allStudents.length === 0}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
              >
                {isSavingAttendance ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                )}
                <span>{isSavingAttendance ? "Salvando..." : "Salvar Chamada"}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Banner de instrucao contextual */}
      {mode === "edit" && selectedStudentObj ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200">
          <span>
            Selecionado: <strong>{selectedStudentObj.name}</strong>. Clique em uma carteira vazia
            para posicionar ou em outro estudante para trocar de lugar.
          </span>
          <button
            type="button"
            onClick={() => setSelectedStudentId(null)}
            className="shrink-0 cursor-pointer rounded-md px-2 py-1 font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/25"
          >
            Cancelar
          </button>
        </div>
      ) : null}

      {mode === "attendance" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-slate-600 dark:text-slate-300">
            Clique em cada carteira para alternar: <strong className="text-emerald-700 dark:text-emerald-400">Verde (P)</strong>,{" "}
            <strong className="text-red-700 dark:text-red-400">Vermelho (F)</strong> e{" "}
            <strong className="text-amber-700 dark:text-amber-400">Âmbar (FJ)</strong>.
          </span>
          <div className="flex items-center gap-3 font-mono font-semibold">
            <span className="text-emerald-700 dark:text-emerald-400">
              P: {attendanceSummary.present}
            </span>
            <span className="text-red-700 dark:text-red-400">
              F: {attendanceSummary.absent}
            </span>
            <span className="text-amber-700 dark:text-amber-400">
              FJ: {attendanceSummary.justified}
            </span>
          </div>
        </div>
      ) : null}

      {/* Grade da Sala + Lista lateral de Alunos sem lugar */}
      {isLoadingMap || isLoadingAttendance ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-9 dark:border-slate-800 dark:bg-slate-900">
            <Skeleton className="mx-auto mb-6 h-10 w-64 rounded-xl" />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {Array.from({ length: 15 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-3 dark:border-slate-800 dark:bg-slate-900">
            <Skeleton className="mb-3 h-5 w-36" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* Espelho da Sala */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-ambient)] sm:p-6 xl:col-span-9 dark:border-slate-800 dark:bg-slate-900">
            {/* Quadro Negro / Frente da Sala */}
            <div className="mx-auto mb-6 flex max-w-md flex-col items-center">
              <div className="w-full rounded-xl border-2 border-slate-700 bg-slate-800 px-4 py-2 text-center text-xs font-semibold tracking-wider text-slate-100 uppercase shadow-xs dark:border-slate-600 dark:bg-slate-950">
                Frente da Sala · Quadro Negro
              </div>
              <span className="mt-1.5 text-[11px] text-slate-400">
                {seatRows} fileiras × {seatCols} colunas ({Object.keys(seatMap).length}/
                {allStudents.length} alocados)
              </span>
            </div>

            {/* Grid de carteiras com scroll horizontal seguro no celular */}
            <div className="overflow-x-auto pb-2">
              <div
                className="grid gap-2.5 sm:gap-3"
                style={{
                  gridTemplateColumns: `repeat(${seatCols}, minmax(108px, 1fr))`,
                }}
              >
                {Array.from({ length: seatRows }).map((_, row) =>
                  Array.from({ length: seatCols }).map((__, col) => {
                    const key = `${row}:${col}`;
                    const studentId = seatMap[key];
                    const student = studentId ? studentById.get(studentId) : null;
                    const isSelected = Boolean(
                      mode === "edit" && student && selectedStudentId === student.id
                    );

                    const attStatus: AttendanceStatus =
                      student && mode === "attendance"
                        ? attendanceByStudent[student.id] ?? "PRESENTE"
                        : "PRESENTE";

                    const hasAcademicAlert = Boolean(
                      student &&
                        ((student.attendanceRate !== null &&
                          student.attendanceRate < LOW_ATTENDANCE_THRESHOLD) ||
                          (student.overallAverage !== null &&
                            student.overallAverage < PASSING_GRADE_THRESHOLD))
                    );

                    let deskColorClass =
                      "border-dashed border-slate-300/90 bg-slate-50/70 text-slate-400 hover:border-slate-400 hover:bg-slate-100/70 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-600";

                    if (student && mode === "edit") {
                      deskColorClass = isSelected
                        ? "border-[var(--school-primary)] bg-blue-50/90 ring-2 ring-[var(--school-primary-ring)] dark:bg-blue-500/20"
                        : "border-slate-200 bg-white shadow-xs hover:border-[var(--school-primary-soft-border)] hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/90";
                    } else if (student && mode === "attendance") {
                      if (attStatus === "PRESENTE") {
                        deskColorClass =
                          "border-emerald-500 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700";
                      } else if (attStatus === "FALTA") {
                        deskColorClass =
                          "border-red-500 bg-red-600 text-white shadow-sm hover:bg-red-700";
                      } else {
                        deskColorClass =
                          "border-amber-500 bg-amber-500 text-slate-950 shadow-sm hover:bg-amber-600";
                      }
                    }

                    const alertTitleParts: string[] = [];
                    if (
                      student &&
                      student.attendanceRate !== null &&
                      student.attendanceRate < LOW_ATTENDANCE_THRESHOLD
                    ) {
                      alertTitleParts.push(`Frequência ${student.attendanceRate}%`);
                    }
                    if (
                      student &&
                      student.overallAverage !== null &&
                      student.overallAverage < PASSING_GRADE_THRESHOLD
                    ) {
                      alertTitleParts.push(`Média ${formatScoreBr(student.overallAverage)}`);
                    }

                    return (
                      <div key={key} className="relative">
                        <button
                          type="button"
                          onClick={() => handleSeatClick(row, col)}
                          disabled={mode === "attendance" && !student}
                          title={
                            student
                              ? `${student.name}${
                                  alertTitleParts.length > 0
                                    ? ` (${alertTitleParts.join(" · ")})`
                                    : ""
                                }`
                              : `Carteira F${row + 1}-C${col + 1} (vazia)`
                          }
                          className={`flex min-h-[96px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all duration-150 active:scale-[0.98] disabled:cursor-default ${deskColorClass}`}
                        >
                          {student ? (
                            <>
                              {/* Indicadores pedagogicos discretos no modo edicao */}
                              {mode === "edit" ? (
                                <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                                  {hasAcademicAlert ? (
                                    <span
                                      title={alertTitleParts.join(" · ")}
                                      className="h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-800"
                                    />
                                  ) : null}
                                  {student.pendingOccurrencesCount > 0 ? (
                                    <span
                                      title={`${student.pendingOccurrencesCount} ocorrência(s) pendente(s)`}
                                      className="text-amber-600 dark:text-amber-400"
                                    >
                                      <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="absolute top-1.5 right-1.5 rounded-md bg-black/20 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                                  {ATTENDANCE_STATUS_META[attStatus].shortLabel}
                                </span>
                              )}

                              <Avatar
                                name={student.name}
                                size="sm"
                                className={
                                  mode === "attendance"
                                    ? "ring-2 ring-white/60"
                                    : ""
                                }
                              />
                              <p
                                className={`mt-1.5 line-clamp-2 text-[11px] font-semibold leading-tight ${
                                  mode === "attendance"
                                    ? attStatus === "JUSTIFICADA"
                                      ? "text-slate-950"
                                      : "text-white"
                                    : "text-slate-900 dark:text-slate-100"
                                }`}
                              >
                                {getShortStudentName(student.name)}
                              </p>
                              {mode === "edit" &&
                              (student.attendanceRate !== null ||
                                student.overallAverage !== null) ? (
                                <p className="mt-0.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                  {student.attendanceRate !== null
                                    ? `${student.attendanceRate}%`
                                    : "-"}
                                  {" · "}
                                  {formatScoreBr(student.overallAverage)}
                                </p>
                              ) : null}
                            </>
                          ) : (
                            <span className="font-mono text-[10px] font-medium">
                              F{row + 1}·C{col + 1}
                            </span>
                          )}
                        </button>

                        {mode === "edit" && student ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromSeat(row, col);
                            }}
                            aria-label={`Remover ${student.name} da carteira`}
                            title="Remover da carteira"
                            className="absolute top-1 right-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-700 dark:hover:text-red-400"
                          >
                            <X className="h-3 w-3" strokeWidth={2} />
                          </button>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {mode === "edit" ? (
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                  Frequência &lt; 75% ou média &lt; 6,0
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  Ocorrência pendente
                </span>
              </div>
            ) : null}
          </section>

          {/* Painel Lateral: Alunos sem lugar (ou chamada dos nao alocados) */}
          <aside className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-ambient)] sm:p-5 xl:col-span-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users
                  className="h-4 w-4 text-[var(--school-primary)] dark:text-blue-400"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Alunos sem lugar
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {unassignedStudents.length}
              </span>
            </div>

            {unassignedStudents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Todos os estudantes ativos estão alocados em carteiras.
              </div>
            ) : (
              <ul className="rco-thin-scrollbar max-h-[460px] space-y-2 overflow-y-auto pr-1">
                {unassignedStudents.map((student) => {
                  const isSelected = selectedStudentId === student.id;
                  const attStatus = attendanceByStudent[student.id] ?? "PRESENTE";

                  if (mode === "attendance") {
                    return (
                      <li key={student.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setAttendanceByStudent((prev) => ({
                              ...prev,
                              [student.id]: STATUS_CYCLE[attStatus],
                            }))
                          }
                          className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors ${ATTENDANCE_STATUS_META[attStatus].activeClass}`}
                        >
                          <span className="truncate">{student.name}</span>
                          <span className="shrink-0 font-mono">
                            {ATTENDANCE_STATUS_META[attStatus].shortLabel}
                          </span>
                        </button>
                      </li>
                    );
                  }

                  return (
                    <li key={student.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedStudentId(isSelected ? null : student.id)
                        }
                        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all ${
                          isSelected
                            ? "border-[var(--school-primary)] bg-blue-50 ring-2 ring-[var(--school-primary-ring)] dark:bg-blue-500/20"
                            : "border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Avatar name={student.name} size="xs" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {student.name}
                          </p>
                          <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            {student.registration}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
