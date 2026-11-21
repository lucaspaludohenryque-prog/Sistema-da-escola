"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { formatIsoDateBr, getTodayIsoDate } from "@/features/attendance/constants";
import type { ApiErrorPayload, ClassroomSummary } from "@/features/classrooms/types";
import { Skeleton } from "@/shared/components/Skeleton";
import { useToast } from "@/shared/components/ToastProvider";
import {
  SCHOOL_EVENT_BADGE_STYLES,
  SCHOOL_EVENT_LABELS,
  SCHOOL_EVENT_PILL_STYLES,
  SCHOOL_EVENT_TYPES,
  type SchoolEventItem,
  type SchoolEventType,
} from "../types";

interface CalendarViewProps {
  initialMonth: string;
  initialEvents: SchoolEventItem[];
  classrooms: ClassroomSummary[];
  canCreate: boolean;
  canCreateGlobal: boolean;
}

const WEEKDAYS_HEADER = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const INPUT_CLASS =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400";

function shiftYearMonth(yearMonth: string, delta: number): string {
  const [yStr, mStr] = yearMonth.split("-");
  const date = new Date(Number(yStr), Number(mStr) - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function CalendarView({
  initialMonth,
  initialEvents,
  classrooms,
  canCreate,
  canCreateGlobal,
}: CalendarViewProps): React.JSX.Element {
  const toast = useToast();
  const todayIso = getTodayIsoDate();

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [events, setEvents] = useState<SchoolEventItem[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayIso);
  const [type, setType] = useState<SchoolEventType>("EVENTO");
  const [classroomId, setClassroomId] = useState(
    () => (canCreateGlobal ? "" : classrooms[0]?.id ?? "")
  );
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadMonth(nextMonth: string): Promise<void> {
    setCurrentMonth(nextMonth);
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/calendar?month=${encodeURIComponent(nextMonth)}`,
        { cache: "no-store" }
      );
      if (response.ok) {
        const payload = (await response.json()) as { events: SchoolEventItem[] };
        setEvents(payload.events);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function openNewEventModal(presetDate?: string): void {
    setTitle("");
    setDate(presetDate ?? todayIso);
    setType("EVENTO");
    setClassroomId(canCreateGlobal ? "" : classrooms[0]?.id ?? "");
    setDescription("");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (title.trim().length < 2) {
      toast.warning("Informe um título com ao menos 2 caracteres.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          date,
          type,
          classroomId: classroomId || null,
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível salvar o evento.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await response.json()) as { event: SchoolEventItem };
      setIsModalOpen(false);
      toast.success("Evento adicionado ao calendário escolar.");

      if (payload.event.date.startsWith(`${currentMonth}-`)) {
        setEvents((prev) =>
          [...prev, payload.event].sort((a, b) => a.date.localeCompare(b.date))
        );
      } else {
        void loadMonth(payload.event.date.slice(0, 7));
      }
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(eventId: string): Promise<void> {
    if (deletingId) return;
    setDeletingId(eventId);
    try {
      const response = await fetch(`/api/calendar/${eventId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error("Não foi possível excluir o evento.");
        return;
      }
      setEvents((prev) => prev.filter((item) => item.id !== eventId));
      toast.success("Evento removido do calendário.");
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setDeletingId(null);
    }
  }

  const [yearNum, monthNum] = currentMonth.split("-").map(Number);
  const year = yearNum ?? new Date().getFullYear();
  const monthIdx = (monthNum ?? 1) - 1;

  const calendarCells = useMemo(() => {
    const firstDayWeekday = new Date(year, monthIdx, 1).getDay();
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

    const cells: Array<{ day: number | null; isoDate: string | null }> = [];
    for (let i = 0; i < firstDayWeekday; i += 1) {
      cells.push({ day: null, isoDate: null });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ day, isoDate: iso });
    }
    return cells;
  }, [year, monthIdx]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, SchoolEventItem[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
              Calendário Escolar
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Acompanhe datas de provas, trabalhos, reuniões, feriados e eventos institucionais.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => void loadMonth(shiftYearMonth(currentMonth, -1))}
                aria-label="Mês anterior"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[140px] px-2 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                {MONTH_NAMES[monthIdx]} {year}
              </span>
              <button
                type="button"
                onClick={() => void loadMonth(shiftYearMonth(currentMonth, 1))}
                aria-label="Próximo mês"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {canCreate && (canCreateGlobal || classrooms.length > 0) ? (
              <button
                type="button"
                onClick={() => openNewEventModal()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                <span>Novo Evento</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-4 dark:border-slate-800">
          {SCHOOL_EVENT_TYPES.map((eventType) => (
            <span
              key={eventType}
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${SCHOOL_EVENT_BADGE_STYLES[eventType]}`}
            >
              {SCHOOL_EVENT_LABELS[eventType]}
            </span>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_1fr]">
        {/* Grade Mensal */}
        <section className="overflow-hidden rounded-2xl bg-white p-4 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-5 dark:bg-slate-900 dark:ring-slate-800">
          {isLoading ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 28 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-[11px] font-semibold text-slate-500 uppercase dark:text-slate-400">
                {WEEKDAYS_HEADER.map((label) => (
                  <div key={label} className="py-1">
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {calendarCells.map((cell, idx) => {
                  if (!cell.day || !cell.isoDate) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-[82px] rounded-xl bg-slate-50/40 dark:bg-slate-950/30"
                      />
                    );
                  }

                  const dayEvents = eventsByDate.get(cell.isoDate) ?? [];
                  const isToday = cell.isoDate === todayIso;

                  return (
                    <div
                      key={cell.isoDate}
                      onClick={() => {
                        if (canCreate && (canCreateGlobal || classrooms.length > 0)) {
                          openNewEventModal(cell.isoDate ?? undefined);
                        }
                      }}
                      className={`min-h-[86px] rounded-xl border p-1.5 transition-colors ${
                        isToday
                          ? "border-[var(--school-primary)] bg-blue-50/40 dark:bg-blue-500/10"
                          : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60"
                      } ${canCreate ? "cursor-pointer hover:border-slate-400 dark:hover:border-slate-600" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-semibold ${
                            isToday
                              ? "bg-[var(--school-primary)] text-white"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {cell.day}
                        </span>
                      </div>

                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            title={`${SCHOOL_EVENT_LABELS[ev.type]}: ${ev.title}`}
                            className={`truncate rounded px-1.5 py-0.5 text-[10px] font-semibold ${SCHOOL_EVENT_PILL_STYLES[ev.type]}`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 ? (
                          <p className="px-1 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            +{dayEvents.length - 2} mais
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Lista lateral dos eventos do mes */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Eventos de {MONTH_NAMES[monthIdx]}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Ordenados cronologicamente
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
              {events.length}
            </span>
          </div>

          {events.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Nenhum evento neste mês
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {canCreate
                  ? "Clique em Novo Evento ou em qualquer dia do calendário para cadastrar."
                  : "Quando a escola agendar provas ou eventos, eles aparecerão aqui."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.map((ev) => (
                <li key={ev.id} className="space-y-1.5 px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${SCHOOL_EVENT_BADGE_STYLES[ev.type]}`}
                      >
                        {SCHOOL_EVENT_LABELS[ev.type]}
                      </span>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {formatIsoDateBr(ev.date)}
                      </span>
                    </div>
                    {ev.canDelete ? (
                      <button
                        type="button"
                        disabled={deletingId === ev.id}
                        onClick={() => void handleDelete(ev.id)}
                        aria-label={`Excluir evento ${ev.title}`}
                        className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {ev.title}
                  </p>
                  {ev.description ? (
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {ev.description}
                    </p>
                  ) : null}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {ev.classroomLabel ?? "Toda a escola"} · por {ev.authorName}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Modal Novo Evento */}
      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-modal-title"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => {
              if (!isSaving) setIsModalOpen(false);
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-slate-700">
            <div className="flex items-start justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
              <h3
                id="calendar-modal-title"
                className="text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                Novo Evento Escolar
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="event-title"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  Título
                </label>
                <input
                  id="event-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Prova Bimestral de Matemática"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="event-date"
                    className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    Data
                  </label>
                  <input
                    id="event-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="event-type"
                    className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    Tipo
                  </label>
                  <select
                    id="event-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as SchoolEventType)}
                    className={INPUT_CLASS}
                  >
                    {SCHOOL_EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {SCHOOL_EVENT_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="event-classroom"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  Alcance / Turma
                </label>
                <select
                  id="event-classroom"
                  required={!canCreateGlobal}
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {canCreateGlobal ? (
                    <option value="">Toda a escola (evento geral)</option>
                  ) : null}
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="event-description"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  Descrição{" "}
                  <span className="text-xs font-normal text-slate-500">(opcional)</span>
                </label>
                <textarea
                  id="event-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes, conteúdos cobrados ou orientações..."
                  className={INPUT_CLASS}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200/80 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--school-primary-hover)] disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>Salvar Evento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
