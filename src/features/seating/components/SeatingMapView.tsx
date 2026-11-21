"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
      <section className="rounded-xl border border-zinc-200/80 bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
          <LayoutGrid className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h2 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Nenhuma turma disponível para mapa de sala
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
            Mapa de Sala
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Organize a disposição das carteiras ou registre a chamada visual diretamente no espelho da turma.
          </p>
        </div>

        {/* Alternador Edicao <-> Chamada Visual */}
        <div className="inline-flex w-fit rounded-lg border border-zinc-200/80 bg-zinc-100/90 p-0.5 dark:border-white/[0.08] dark:bg-[#1A1D21]">
          <button
            type="button"
            onClick={() => {
              setMode("edit");
              setSelectedStudentId(null);
            }}
            className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
              mode === "edit"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-[#131518] dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>Edição do Mapa</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("attendance");
              setSelectedStudentId(null);
            }}
            className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
              mode === "attendance"
                ? "bg-[var(--school-primary)] text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <ClipboardCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>Chamada Visual</span>
          </button>
        </div>
      </header>

      {/* Barra superior de controle */}
      <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1 sm:flex-initial">
              <label
                htmlFor="seating-classroom"
                className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Turma
              </label>
              <select
                id="seating-classroom"
                value={selectedClassroomId}
                onChange={(e) => handleClassroomChange(e.target.value)}
                className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm font-medium text-zinc-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
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
                    className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Fileiras
                  </label>
                  <select
                    id="seat-rows"
                    value={seatRows}
                    onChange={(e) =>
                      handleDimensionChange(Number(e.target.value), seatCols)
                    }
                    className="h-9 rounded-lg border border-zinc-200/90 bg-white px-2.5 text-sm font-medium tabular-nums text-zinc-900 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="pb-2 text-xs text-zinc-400">×</span>
                <div>
                  <label
                    htmlFor="seat-cols"
                    className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Colunas
                  </label>
                  <select
                    id="seat-cols"
                    value={seatCols}
                    onChange={(e) =>
                      handleDimensionChange(seatRows, Number(e.target.value))
                    }
                    className="h-9 rounded-lg border border-zinc-200/90 bg-white px-2.5 text-sm font-medium tabular-nums text-zinc-900 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
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

          {mode === "edit" ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAutoDistribute}
                disabled={isLoadingMap || allStudents.length === 0}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
              >
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span>Distribuir</span>
              </button>
              <button
                type="button"
                onClick={handleClearMap}
                disabled={isLoadingMap || Object.keys(seatMap).length === 0}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-medium text-zinc-600 transition-colors hover:border-red-200 hover:bg-red-50/70 hover:text-red-700 disabled:opacity-50 dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-300 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              >
                <Eraser className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span>Limpar</span>
              </button>
              <button
                type="button"
                onClick={handleSaveMap}
                disabled={isSavingMap || isLoadingMap}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[var(--school-primary-hover)] disabled:opacity-60"
              >
                {isSavingMap ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                )}
                <span>{isSavingMap ? "Salvando..." : "Salvar Mapa"}</span>
              </button>
            </div>
          ) : null}
        </div>

        {mode === "attendance" ? (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-zinc-200/70 pt-4 sm:grid-cols-12 dark:border-white/[0.07]">
            <div className="sm:col-span-3">
              <label
                htmlFor="visual-att-date"
                className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Data da Aula
              </label>
              <input
                id="visual-att-date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="visual-att-lesson"
                className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Nº Aula
              </label>
              <select
                id="visual-att-lesson"
                value={lessonNumber}
                onChange={(e) => setLessonNumber(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
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
                className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Conteúdo Ministrado
              </label>
              <input
                id="visual-att-content"
                type="text"
                value={lessonContent}
                onChange={(e) => setLessonContent(e.target.value)}
                placeholder="Ex.: Equações do 2º grau - revisão"
                className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>

            <div className="flex items-end sm:col-span-3">
              <button
                type="button"
                onClick={handleSaveVisualAttendance}
                disabled={isSavingAttendance || isLoadingAttendance || allStudents.length === 0}
                className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--school-primary-hover)] disabled:opacity-60"
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
        ) : null}
      </section>

      {/* Banner de instrucao contextual */}
      {mode === "edit" && selectedStudentObj ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-xs text-zinc-700 dark:border-white/15 dark:bg-[#1A1D21] dark:text-zinc-200">
          <span>
            Selecionado: <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedStudentObj.name}</strong>. Clique em uma carteira vazia para posicionar ou em outro estudante para trocar.
          </span>
          <button
            type="button"
            onClick={() => setSelectedStudentId(null)}
            className="shrink-0 cursor-pointer rounded-md px-2 py-1 font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100"
          >
            Cancelar
          </button>
        </div>
      ) : null}

      {mode === "attendance" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200/80 bg-white px-4 py-2.5 text-xs dark:border-white/[0.08] dark:bg-[#131518]">
          <span className="text-zinc-500 dark:text-zinc-400">
            Clique na carteira para alternar entre <strong className="font-medium text-emerald-700 dark:text-emerald-400">Presente (P)</strong>,{" "}
            <strong className="font-medium text-red-700 dark:text-red-400">Falta (F)</strong> e{" "}
            <strong className="font-medium text-amber-700 dark:text-amber-400">Justificada (FJ)</strong>.
          </span>
          <div className="flex items-center gap-3 font-mono font-medium tabular-nums">
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

      {/* Diagrama arquitetonico da sala + Lista lateral */}
      {isLoadingMap || isLoadingAttendance ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 xl:col-span-9 dark:border-white/[0.08] dark:bg-[#131518]">
            <Skeleton className="mx-auto mb-6 h-8 w-56 rounded-lg" />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {Array.from({ length: 15 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 xl:col-span-3 dark:border-white/[0.08] dark:bg-[#131518]">
            <Skeleton className="mb-3 h-5 w-36" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* Espelho da Sala */}
          <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6 xl:col-span-9 dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
            {/* Quadro discreto na frente da sala */}
            <div className="mx-auto mb-6 flex max-w-md flex-col items-center">
              <div className="w-full rounded-md border border-zinc-300 bg-zinc-100/90 px-4 py-1.5 text-center text-[11px] font-medium tracking-wider text-zinc-600 uppercase dark:border-white/[0.12] dark:bg-[#1A1D21] dark:text-zinc-300">
                Frente da Sala · Quadro
              </div>
              <span className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                {seatRows} × {seatCols} · {Object.keys(seatMap).length}/{allStudents.length} alocados
              </span>
            </div>

            {/* Grid de carteiras com scroll horizontal seguro no celular */}
            <div className="overflow-x-auto pb-2">
              <div
                className="grid gap-2.5"
                style={{
                  gridTemplateColumns: `repeat(${seatCols}, minmax(116px, 1fr))`,
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

                    const hasCornerAlert = Boolean(
                      hasAcademicAlert || (student && student.pendingOccurrencesCount > 0)
                    );

                    let deskColorClass =
                      "border-dashed border-zinc-300/80 bg-zinc-50/50 text-zinc-400 hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#0C0D0F]/40 dark:hover:border-white/[0.18]";

                    if (student && mode === "edit") {
                      deskColorClass = isSelected
                        ? "border-[var(--school-primary)] bg-zinc-50 ring-2 ring-[var(--school-primary-ring)] dark:bg-[#1A1D21]"
                        : "border-zinc-200/90 bg-white hover:border-zinc-300 dark:border-white/[0.1] dark:bg-[#1A1D21]/80 dark:hover:border-white/[0.18]";
                    } else if (student && mode === "attendance") {
                      if (attStatus === "PRESENTE") {
                        deskColorClass =
                          "border-emerald-300/90 bg-emerald-50/80 text-emerald-950 hover:bg-emerald-100/70 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100";
                      } else if (attStatus === "FALTA") {
                        deskColorClass =
                          "border-red-300/90 bg-red-50/80 text-red-950 hover:bg-red-100/70 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-100";
                      } else {
                        deskColorClass =
                          "border-amber-300/90 bg-amber-50/80 text-amber-950 hover:bg-amber-100/70 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100";
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
                    if (student && student.pendingOccurrencesCount > 0) {
                      alertTitleParts.push(
                        `${student.pendingOccurrencesCount} ocorrência(s) pendente(s)`
                      );
                    }

                    return (
                      <div key={key} className="group/desk relative">
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
                          className={`flex min-h-[88px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border p-2.5 text-center transition-colors disabled:cursor-default ${deskColorClass}`}
                        >
                          {student ? (
                            <>
                              {/* Indicador unico e sutil no canto */}
                              {mode === "edit" && hasCornerAlert ? (
                                <span
                                  aria-hidden="true"
                                  className={`absolute top-2 left-2 h-2 w-2 rounded-full ${
                                    hasAcademicAlert ? "bg-red-500" : "bg-amber-500"
                                  }`}
                                />
                              ) : mode === "attendance" ? (
                                <span
                                  className={`absolute top-1.5 right-1.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                                    attStatus === "PRESENTE"
                                      ? "bg-emerald-600/15 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200"
                                      : attStatus === "FALTA"
                                        ? "bg-red-600/15 text-red-800 dark:bg-red-400/20 dark:text-red-200"
                                        : "bg-amber-600/15 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200"
                                  }`}
                                >
                                  {ATTENDANCE_STATUS_META[attStatus].shortLabel}
                                </span>
                              ) : null}

                              <Avatar name={student.name} size="xs" />
                              <p
                                className={`mt-1.5 line-clamp-2 text-xs font-medium leading-tight ${
                                  mode === "attendance"
                                    ? "text-current"
                                    : "text-zinc-900 dark:text-zinc-100"
                                }`}
                              >
                                {getShortStudentName(student.name)}
                              </p>
                              {mode === "edit" &&
                              (student.attendanceRate !== null ||
                                student.overallAverage !== null) ? (
                                <p className="mt-0.5 font-mono text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400">
                                  {student.attendanceRate !== null
                                    ? `${student.attendanceRate}%`
                                    : "-"}
                                  {" · "}
                                  {formatScoreBr(student.overallAverage)}
                                </p>
                              ) : null}
                            </>
                          ) : (
                            <span className="font-mono text-[10px] tabular-nums">
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
                            className="absolute top-1 right-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded text-zinc-400 opacity-70 transition-opacity hover:bg-zinc-100 hover:text-red-600 hover:opacity-100 group-hover/desk:opacity-100 dark:hover:bg-white/[0.08] dark:hover:text-red-400"
                          >
                            <X className="h-3 w-3" strokeWidth={1.75} />
                          </button>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {mode === "edit" ? (
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-200/70 pt-3 text-[11px] text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Frequência &lt; 75% ou média &lt; 6,0
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Ocorrência pendente
                </span>
              </div>
            ) : null}
          </section>

          {/* Painel Lateral: Alunos sem lugar */}
          <aside className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] xl:col-span-3 dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
            <div className="mb-3 flex items-center justify-between border-b border-zinc-200/70 pb-2.5 dark:border-white/[0.07]">
              <div className="flex items-center gap-2">
                <Users
                  className="h-4 w-4 text-zinc-400 dark:text-zinc-500"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <h3 className="text-xs font-semibold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                  Sem lugar
                </h3>
              </div>
              <span className="font-mono text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
                {unassignedStudents.length}
              </span>
            </div>

            {unassignedStudents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-xs text-zinc-500 dark:border-white/[0.08] dark:text-zinc-400">
                Todos os estudantes ativos estão alocados em carteiras.
              </div>
            ) : (
              <ul className="rco-thin-scrollbar max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
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
                          className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${ATTENDANCE_STATUS_META[attStatus].activeClass}`}
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
                        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                          isSelected
                            ? "border-[var(--school-primary)] bg-zinc-50 ring-2 ring-[var(--school-primary-ring)] dark:bg-[#1A1D21]"
                            : "border-zinc-200/80 bg-white hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-[#1A1D21]/50 dark:hover:bg-[#1A1D21]"
                        }`}
                      >
                        <Avatar name={student.name} size="xs" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                            {student.name}
                          </p>
                          <p className="font-mono text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400">
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
