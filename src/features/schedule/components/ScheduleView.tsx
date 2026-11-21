"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Clock,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { LESSON_NUMBERS } from "@/features/attendance/constants";
import { SHIFT_LABELS } from "@/features/classrooms/constants";
import type { ApiErrorPayload, ClassroomSummary } from "@/features/classrooms/types";
import { Skeleton } from "@/shared/components/Skeleton";
import { useToast } from "@/shared/components/ToastProvider";
import {
  DEFAULT_LESSON_TIMES,
  SCHEDULE_DAYS,
  SCHEDULE_DAY_LABELS,
  type ScheduleDayOfWeek,
  type ScheduleSlotItem,
} from "../types";

interface ScheduleViewProps {
  initialSlots: ScheduleSlotItem[];
  classrooms: ClassroomSummary[];
  canManage: boolean;
}

const INPUT_CLASS =
  "block w-full rounded-lg border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-400";

export function ScheduleView({
  initialSlots,
  classrooms,
  canManage,
}: ScheduleViewProps): React.JSX.Element {
  const toast = useToast();
  const [slots, setSlots] = useState<ScheduleSlotItem[]>(initialSlots);
  const [classroomFilter, setClassroomFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formClassroomId, setFormClassroomId] = useState(
    () => classrooms[0]?.id ?? ""
  );
  const [dayOfWeek, setDayOfWeek] = useState<ScheduleDayOfWeek>(1);
  const [lessonNumber, setLessonNumber] = useState<number>(1);
  const [startTime, setStartTime] = useState(DEFAULT_LESSON_TIMES[1]?.startTime ?? "07:30");
  const [endTime, setEndTime] = useState(DEFAULT_LESSON_TIMES[1]?.endTime ?? "08:20");
  const [room, setRoom] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const preset = DEFAULT_LESSON_TIMES[lessonNumber];
    if (preset) {
      setStartTime(preset.startTime);
      setEndTime(preset.endTime);
    }
  }, [lessonNumber]);

  async function handleFilterChange(nextClassroomId: string): Promise<void> {
    setClassroomFilter(nextClassroomId);
    setIsLoading(true);
    try {
      const url = nextClassroomId
        ? `/api/schedule?classroomId=${encodeURIComponent(nextClassroomId)}`
        : "/api/schedule";
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        const payload = (await response.json()) as { slots: ScheduleSlotItem[] };
        setSlots(payload.slots);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function openAddModal(presetDay?: ScheduleDayOfWeek, presetLesson?: number): void {
    setFormClassroomId(classroomFilter || classrooms[0]?.id || "");
    if (presetDay) setDayOfWeek(presetDay);
    if (presetLesson) setLessonNumber(presetLesson);
    setRoom("");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!formClassroomId) {
      toast.warning("Selecione uma turma.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: formClassroomId,
          dayOfWeek,
          lessonNumber,
          startTime,
          endTime,
          room: room.trim(),
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível salvar o horário.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await response.json()) as { slot: ScheduleSlotItem };
      setSlots((prev) => {
        const filtered = prev.filter(
          (item) =>
            !(
              item.classroomId === payload.slot.classroomId &&
              item.dayOfWeek === payload.slot.dayOfWeek &&
              item.lessonNumber === payload.slot.lessonNumber
            )
        );
        return [...filtered, payload.slot].sort(
          (a, b) => a.dayOfWeek - b.dayOfWeek || a.lessonNumber - b.lessonNumber
        );
      });
      setIsModalOpen(false);
      toast.success("Horário salvo na grade semanal.");
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(slotId: string): Promise<void> {
    if (deletingId) return;
    setDeletingId(slotId);
    try {
      const response = await fetch(`/api/schedule/${slotId}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error("Não foi possível remover o horário.");
        return;
      }
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      toast.success("Horário removido da grade.");
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setDeletingId(null);
    }
  }

  const gridMap = useMemo(() => {
    const map = new Map<string, ScheduleSlotItem[]>();
    for (const slot of slots) {
      const key = `${slot.dayOfWeek}:${slot.lessonNumber}`;
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    return map;
  }, [slots]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-zinc-200/80 sm:p-6 dark:bg-[#131518] dark:ring-white/[0.08]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl dark:text-zinc-100">
              Grade de Horários Semanal
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {canManage
                ? "Organize os horários das aulas de Segunda a Sexta e abra a chamada em um clique."
                : "Consulte a grade semanal de aulas e salas da turma."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {canManage && classrooms.length > 1 ? (
              <select
                aria-label="Filtrar grade por turma"
                value={classroomFilter}
                onChange={(event) => void handleFilterChange(event.target.value)}
                className="rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
              >
                <option value="">Todas as turmas</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.subject}
                  </option>
                ))}
              </select>
            ) : null}

            {canManage && classrooms.length > 0 ? (
              <button
                type="button"
                onClick={() => openAddModal()}
                className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)]"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                <span>Adicionar Horário</span>
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-[var(--shadow-ambient)] ring-1 ring-zinc-200/80 dark:bg-[#131518] dark:ring-white/[0.08]">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/90 text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-200">
                  <th
                    scope="col"
                    className="w-24 border-r border-zinc-200 px-3 py-3.5 text-center font-semibold dark:border-white/[0.08]"
                  >
                    Aula
                  </th>
                  {SCHEDULE_DAYS.map((day) => (
                    <th
                      key={day}
                      scope="col"
                      className="w-1/5 border-r border-zinc-200/80 px-3 py-3.5 font-semibold last:border-r-0 dark:border-white/[0.08]"
                    >
                      {SCHEDULE_DAY_LABELS[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80/80 dark:divide-white/[0.06]">
                {LESSON_NUMBERS.map((num) => {
                  const defaultTime = DEFAULT_LESSON_TIMES[num];
                  return (
                    <tr key={num} className="align-top">
                      <td className="border-r border-zinc-200 bg-zinc-50/50 px-3 py-3 text-center dark:border-white/[0.08] dark:bg-[#1A1D21]/30">
                        <p className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {num}ª aula
                        </p>
                        {defaultTime ? (
                          <p className="mt-0.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                            {defaultTime.startTime}
                          </p>
                        ) : null}
                      </td>

                      {SCHEDULE_DAYS.map((day) => {
                        const cellSlots = gridMap.get(`${day}:${num}`) ?? [];
                        return (
                          <td
                            key={`${day}:${num}`}
                            className="min-h-[96px] border-r border-zinc-200/70 p-2 last:border-r-0 dark:border-white/[0.08]"
                          >
                            {cellSlots.length === 0 ? (
                              canManage && classrooms.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => openAddModal(day, num)}
                                  className="flex h-20 w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-zinc-200 text-zinc-400 transition-colors hover:border-[var(--school-primary-soft-border)] hover:bg-zinc-50 hover:text-[var(--school-primary)] dark:border-white/[0.08] dark:text-zinc-600 dark:hover:bg-white/[0.03] dark:hover:text-blue-400"
                                  aria-label={`Adicionar horário ${SCHEDULE_DAY_LABELS[day]} ${num}ª aula`}
                                >
                                  <Plus className="h-4 w-4" strokeWidth={1.75} />
                                </button>
                              ) : (
                                <div className="flex h-20 items-center justify-center text-[11px] text-slate-300 dark:text-zinc-700">
                                  -
                                </div>
                              )
                            ) : (
                              <div className="space-y-2">
                                {cellSlots.map((slot) => (
                                  <div
                                    key={slot.id}
                                    className="rounded-xl border border-zinc-200/90 bg-zinc-50/70 p-2.5 transition-colors hover:border-[var(--school-primary-soft-border)] dark:border-white/[0.1] dark:bg-white/[0.04]"
                                  >
                                    <div className="flex items-start justify-between gap-1.5">
                                      <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                          {slot.classroom.subject}
                                        </p>
                                        <p className="truncate text-[11px] font-medium text-[var(--school-primary)] dark:text-blue-400">
                                          {slot.classroom.name}
                                        </p>
                                      </div>
                                      {slot.canEdit ? (
                                        <button
                                          type="button"
                                          disabled={deletingId === slot.id}
                                          onClick={() => void handleDelete(slot.id)}
                                          aria-label="Remover horário"
                                          className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                                        </button>
                                      ) : null}
                                    </div>

                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                                      <span className="inline-flex items-center gap-0.5 font-mono">
                                        <Clock className="h-3 w-3" />
                                        {slot.startTime}-{slot.endTime}
                                      </span>
                                      {slot.room ? (
                                        <span className="inline-flex items-center gap-0.5">
                                          <MapPin className="h-3 w-3" />
                                          {slot.room}
                                        </span>
                                      ) : null}
                                    </div>

                                    {canManage ? (
                                      <Link
                                        href={`/dashboard/chamada?classroomId=${encodeURIComponent(slot.classroomId)}&lessonNumber=${slot.lessonNumber}`}
                                        className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-[var(--school-primary)] ring-1 ring-inset ring-zinc-200 transition-colors hover:bg-blue-50 dark:bg-[#131518] dark:text-blue-300 dark:ring-white/[0.1] dark:hover:bg-[#1A1D21]"
                                      >
                                        <ClipboardCheck className="h-3 w-3" strokeWidth={1.75} />
                                        <span>Abrir Chamada</span>
                                      </Link>
                                    ) : (
                                      <p className="mt-1 truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                                        Prof. {slot.classroom.teacherName}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Adicionar Horario */}
      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={() => {
              if (!isSaving) setIsModalOpen(false);
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl ring-1 ring-zinc-200/90 dark:bg-[#131518] dark:ring-white/[0.1]">
            <div className="flex items-start justify-between border-b border-zinc-200/80 pb-4 dark:border-white/[0.08]">
              <div>
                <h3
                  id="schedule-modal-title"
                  className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  Adicionar Horário
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Se já existir horário na mesma turma/dia/aula, ele será atualizado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-[#1A1D21]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="slot-classroom"
                  className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Turma
                </label>
                <select
                  id="slot-classroom"
                  required
                  value={formClassroomId}
                  onChange={(e) => setFormClassroomId(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.subject} ({SHIFT_LABELS[c.shift]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="slot-day"
                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                  >
                    Dia da semana
                  </label>
                  <select
                    id="slot-day"
                    value={dayOfWeek}
                    onChange={(e) =>
                      setDayOfWeek(Number(e.target.value) as ScheduleDayOfWeek)
                    }
                    className={INPUT_CLASS}
                  >
                    {SCHEDULE_DAYS.map((day) => (
                      <option key={day} value={day}>
                        {SCHEDULE_DAY_LABELS[day]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="slot-lesson"
                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                  >
                    Nº da Aula
                  </label>
                  <select
                    id="slot-lesson"
                    value={lessonNumber}
                    onChange={(e) => setLessonNumber(Number(e.target.value))}
                    className={INPUT_CLASS}
                  >
                    {LESSON_NUMBERS.map((n) => (
                      <option key={n} value={n}>
                        {n}ª aula
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="slot-start"
                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                  >
                    Início
                  </label>
                  <input
                    id="slot-start"
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="slot-end"
                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                  >
                    Término
                  </label>
                  <input
                    id="slot-end"
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="slot-room"
                  className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Sala / Laboratório{" "}
                  <span className="text-xs font-normal text-zinc-500">(opcional)</span>
                </label>
                <input
                  id="slot-room"
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Ex: Sala 12, Lab. Informática"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-200/80 pt-4 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="cursor-pointer rounded-lg border border-zinc-200/90 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--school-primary-hover)] disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>Salvar Horário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
