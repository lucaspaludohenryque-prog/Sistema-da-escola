"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  Video,
  X,
  XCircle,
} from "lucide-react";
import {
  formatIsoDateBr,
  getTodayIsoDate,
} from "@/features/attendance/constants";
import type { UserRole } from "@/features/auth/types";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import type { ThreadStudentOption } from "@/features/messages/types";
import { useToast } from "@/shared/components/ToastProvider";
import {
  MEETING_MODES,
  MEETING_MODE_LABELS,
  MEETING_STATUS_LABELS,
  MEETING_STATUS_STYLES,
  type MeetingItem,
  type MeetingMode,
  type MeetingStatus,
} from "../types";

interface MeetingsViewProps {
  userRole: UserRole;
  initialMeetings: MeetingItem[];
  studentOptions: ThreadStudentOption[];
}

export function MeetingsView({
  userRole,
  initialMeetings,
  studentOptions,
}: MeetingsViewProps): React.JSX.Element {
  const toast = useToast();
  const isStaff =
    userRole === "ADMIN" ||
    userRole === "COORDENACAO" ||
    userRole === "PROFESSOR";

  const [meetings, setMeetings] = useState<MeetingItem[]>(initialMeetings);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal Solicitar Novo Horario (Responsavel)
  const [rescheduleTarget, setRescheduleTarget] = useState<MeetingItem | null>(
    null
  );
  const [guardianNote, setGuardianNote] = useState("");

  // Modal Agendar Reuniao (Staff)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formStudentId, setFormStudentId] = useState(
    studentOptions[0]?.studentId ?? ""
  );
  const [formGuardianId, setFormGuardianId] = useState(
    studentOptions[0]?.guardians[0]?.id ?? ""
  );
  const [formDate, setFormDate] = useState(getTodayIsoDate);
  const [formTime, setFormTime] = useState("14:30");
  const [formMode, setFormMode] = useState<MeetingMode>("PRESENCIAL");
  const [formLocation, setFormLocation] = useState("Sala da Coordenação");
  const [formNotes, setFormNotes] = useState("");
  const [formAddToCalendar, setFormAddToCalendar] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const selectedStudent = useMemo(
    () => studentOptions.find((s) => s.studentId === formStudentId) ?? studentOptions[0],
    [studentOptions, formStudentId]
  );

  async function handleCreateMeeting(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          studentId: formStudentId,
          guardianId: formGuardianId || undefined,
          date: formDate,
          time: formTime,
          mode: formMode,
          locationOrLink: formLocation,
          notes: formNotes || undefined,
          addToCalendar: formAddToCalendar,
        }),
      });

      if (!res.ok) {
        let message = "Não foi possível agendar a reunião.";
        try {
          const payload = (await res.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await res.json()) as {
        meeting: MeetingItem;
        calendarEventCreated: boolean;
      };
      setMeetings((prev) => [payload.meeting, ...prev]);
      setIsCreateOpen(false);
      setFormTitle("");
      setFormNotes("");
      toast.success(
        payload.calendarEventCreated
          ? "Reunião agendada, responsável notificado e evento adicionado ao Calendário."
          : "Reunião agendada e responsável notificado.",
        "Reunião convocada"
      );
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateMeeting(
    id: string,
    body: { status: MeetingStatus; guardianNote?: string | null }
  ): Promise<void> {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let message = "Não foi possível atualizar a reunião.";
        try {
          const payload = (await res.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await res.json()) as { meeting: MeetingItem };
      setMeetings((prev) =>
        prev.map((m) => (m.id === id ? payload.meeting : m))
      );
      setRescheduleTarget(null);
      setGuardianNote("");
      toast.success("Status da reunião atualizado.");
    } catch {
      toast.error("Falha de conexão.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isStaff
            ? "Agende reuniões presenciais ou online com responsáveis e acompanhe confirmações."
            : "Consulte reuniões convocadas pela escola, confirme sua presença ou sugira outro horário."}
        </p>

        {isStaff && studentOptions.length > 0 ? (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--school-primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98] sm:text-sm"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            <span>Agendar Reunião</span>
          </button>
        ) : null}
      </div>

      {meetings.length === 0 ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <CalendarClock className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
            Nenhuma reunião pedagógica agendada
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isStaff
              ? "Clique em Agendar Reunião para convocar um responsável vinculado."
              : "Quando a escola convocar uma reunião, ela aparecerá aqui."}
          </p>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {meetings.map((m) => {
            const isOnlineLink =
              m.mode === "ONLINE" && /^https?:\/\//i.test(m.locationOrLink);
            const isUpdating = updatingId === m.id;

            return (
              <article
                key={m.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-ambient)] dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${MEETING_STATUS_STYLES[m.status]}`}
                      >
                        {MEETING_STATUS_LABELS[m.status]}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {m.mode === "ONLINE" ? (
                          <Video className="h-3 w-3" />
                        ) : (
                          <MapPin className="h-3 w-3" />
                        )}
                        {MEETING_MODE_LABELS[m.mode]}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <CalendarDays className="h-3.5 w-3.5 text-[var(--school-primary)] dark:text-blue-400" />
                      <span>
                        {formatIsoDateBr(m.date)} · {m.time}
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
                    {m.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Estudante: <strong>{m.studentName}</strong> ({m.classroomName} ·{" "}
                    {m.classroomSubject})
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Responsável: {m.guardianName} · Organizada por {m.organizerName}
                  </p>

                  <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs dark:bg-slate-800/60">
                    {isOnlineLink ? (
                      <a
                        href={m.locationOrLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-[var(--school-primary)] hover:underline dark:text-blue-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Acessar sala online da reunião</span>
                      </a>
                    ) : (
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Local / Link: {m.locationOrLink}
                      </span>
                    )}
                    {m.notes ? (
                      <p className="mt-1 text-slate-600 dark:text-slate-300">
                        Pauta: {m.notes}
                      </p>
                    ) : null}
                  </div>

                  {m.guardianNote ? (
                    <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200">
                      <strong>Observação do responsável:</strong> {m.guardianNote}
                    </div>
                  ) : null}
                </div>

                {/* Acoes por perfil */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
                  {userRole === "RESPONSAVEL" &&
                  (m.status === "CONVOCADA" || m.status === "REMARCAR") ? (
                    <>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          void handleUpdateMeeting(m.id, { status: "CONFIRMADA" })
                        }
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Confirmar Presença</span>
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => {
                          setRescheduleTarget(m);
                          setGuardianNote(m.guardianNote ?? "");
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-xs transition-colors hover:bg-amber-600 disabled:opacity-50"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>Solicitar Novo Horário</span>
                      </button>
                    </>
                  ) : null}

                  {isStaff &&
                  m.status !== "CONCLUIDA" &&
                  m.status !== "CANCELADA" ? (
                    <>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          void handleUpdateMeeting(m.id, { status: "CONCLUIDA" })
                        }
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Marcar Concluída</span>
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          void handleUpdateMeeting(m.id, { status: "CANCELADA" })
                        }
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Cancelar</span>
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Agendar Reuniao (Staff) */}
      {isCreateOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-meeting-title"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => setIsCreateOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="new-meeting-title"
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                Agendar Reunião Pedagógica
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Fechar"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Título / Pauta Principal
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex.: Acompanhamento de desempenho do 2º Trimestre"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Estudante
                  </label>
                  <select
                    required
                    value={formStudentId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setFormStudentId(nextId);
                      const opt = studentOptions.find((s) => s.studentId === nextId);
                      setFormGuardianId(opt?.guardians[0]?.id ?? "");
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {studentOptions.map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.studentName} ({s.classroomName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Responsável Vinculado
                  </label>
                  <select
                    required
                    value={formGuardianId}
                    onChange={(e) => setFormGuardianId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {(selectedStudent?.guardians ?? []).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.relationship})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Horário
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Modalidade
                  </label>
                  <select
                    value={formMode}
                    onChange={(e) => {
                      const nextMode = e.target.value as MeetingMode;
                      setFormMode(nextMode);
                      setFormLocation(
                        nextMode === "ONLINE"
                          ? "https://meet.google.com/"
                          : "Sala da Coordenação"
                      );
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {MEETING_MODES.map((m) => (
                      <option key={m} value={m}>
                        {MEETING_MODE_LABELS[m]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {formMode === "ONLINE" ? "Link da Videochamada" : "Sala / Local"}
                </label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Observações / Pauta (opcional)
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={formAddToCalendar}
                  onChange={(e) => setFormAddToCalendar(e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--school-primary)]"
                />
                <span>Adicionar também ao Calendário Escolar</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--school-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--school-primary-hover)] disabled:opacity-60"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>{isCreating ? "Agendando..." : "Convocar Reunião"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal Solicitar Novo Horario (Responsavel) */}
      {rescheduleTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reschedule-title"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => setRescheduleTarget(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h2
              id="reschedule-title"
              className="text-base font-semibold text-slate-900 dark:text-white"
            >
              Solicitar Novo Horário
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {rescheduleTarget.title} · {formatIsoDateBr(rescheduleTarget.date)} às{" "}
              {rescheduleTarget.time}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleUpdateMeeting(rescheduleTarget.id, {
                  status: "REMARCAR",
                  guardianNote: guardianNote.trim() || "Solicito reagendamento.",
                });
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sugestão de dia/horário
                </label>
                <textarea
                  required
                  rows={3}
                  value={guardianNote}
                  onChange={(e) => setGuardianNote(e.target.value)}
                  placeholder="Ex.: Posso às 16h no mesmo dia ou na quinta-feira de manhã."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingId === rescheduleTarget.id}
                  className="cursor-pointer rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-600 disabled:opacity-60"
                >
                  Enviar Sugestão
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
