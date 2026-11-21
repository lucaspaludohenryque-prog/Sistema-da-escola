"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  formatIsoDateBr,
  getTodayIsoDate,
} from "@/features/attendance/constants";
import type { UserRole } from "@/features/auth/types";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import { Avatar } from "@/shared/components/Avatar";
import { Skeleton } from "@/shared/components/Skeleton";
import { useToast } from "@/shared/components/ToastProvider";
import {
  HOMEWORK_TYPES,
  HOMEWORK_TYPE_LABELS,
  HOMEWORK_TYPE_STYLES,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUS_STYLES,
  type HomeworkItem,
  type HomeworkSubmissionDetail,
  type HomeworkSubmissionStatus,
  type HomeworkType,
} from "../types";

interface ClassroomOption {
  id: string;
  name: string;
  subject: string;
}

interface HomeworkBoardViewProps {
  userRole: UserRole;
  initialHomeworks: HomeworkItem[];
  classrooms: ClassroomOption[];
}

function getDeadlineBadge(
  dueDate: string,
  isCompleted: boolean
): { label: string; className: string } {
  const todayStr = getTodayIsoDate();
  const [ty, tm, td] = todayStr.split("-").map(Number);
  const [dy, dm, dd] = dueDate.split("-").map(Number);

  if (!ty || !tm || !td || !dy || !dm || !dd) {
    return {
      label: `Entrega: ${formatIsoDateBr(dueDate)}`,
      className:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    };
  }

  const todayUtc = Date.UTC(ty, tm - 1, td);
  const dueUtc = Date.UTC(dy, dm - 1, dd);
  const diffDays = Math.round((dueUtc - todayUtc) / (1000 * 60 * 60 * 24));

  if (isCompleted) {
    return {
      label: `Prazo: ${formatIsoDateBr(dueDate)}`,
      className:
        "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
    };
  }

  if (diffDays < 0) {
    return {
      label: "Prazo encerrado",
      className:
        "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30",
    };
  }

  if (diffDays === 0) {
    return {
      label: "Vence hoje!",
      className:
        "bg-red-600 text-white shadow-xs",
    };
  }

  if (diffDays === 1) {
    return {
      label: "Vence amanhã",
      className:
        "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
    };
  }

  if (diffDays <= 3) {
    return {
      label: `Em ${diffDays} dias`,
      className:
        "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
    };
  }

  return {
    label: `Entrega: ${formatIsoDateBr(dueDate)}`,
    className:
      "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  };
}

export function HomeworkBoardView({
  userRole,
  initialHomeworks,
  classrooms,
}: HomeworkBoardViewProps): React.JSX.Element {
  const toast = useToast();
  const isStaff =
    userRole === "ADMIN" ||
    userRole === "COORDENACAO" ||
    userRole === "PROFESSOR";

  const [homeworks, setHomeworks] = useState<HomeworkItem[]>(initialHomeworks);
  const [classroomFilter, setClassroomFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [familyTab, setFamilyTab] = useState<
    "PENDENTES" | "ENTREGUES" | "MATERIAIS" | "TODOS"
  >("PENDENTES");

  // Modal Nova Tarefa (staff)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formClassroomId, setFormClassroomId] = useState<string>(
    classrooms[0]?.id ?? ""
  );
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<HomeworkType>("TAREFA");
  const [formDueDate, setFormDueDate] = useState(getTodayIsoDate);
  const [formResourceUrl, setFormResourceUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAddToCalendar, setFormAddToCalendar] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Modal Acompanhar Entregas (staff)
  const [trackingHomework, setTrackingHomework] = useState<HomeworkItem | null>(
    null
  );
  const [submissions, setSubmissions] = useState<HomeworkSubmissionDetail[]>([]);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>(
    {}
  );
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  // Modal Marcar como Entregue (aluno)
  const [submittingHw, setSubmittingHw] = useState<HomeworkItem | null>(null);
  const [studentNote, setStudentNote] = useState("");
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredHomeworks = useMemo(() => {
    return homeworks.filter((hw) => {
      if (isStaff) {
        if (classroomFilter !== "ALL" && hw.classroomId !== classroomFilter) {
          return false;
        }
        if (typeFilter !== "ALL" && hw.type !== typeFilter) {
          return false;
        }
        return true;
      }

      // Filtros de Aluno e Responsavel
      if (familyTab === "MATERIAIS") {
        return hw.type === "MATERIAL" || hw.type === "LEITURA";
      }
      if (familyTab === "ENTREGUES") {
        return hw.studentSubmissions.some(
          (s) => s.status === "ENTREGUE" || s.status === "CONFERIDO"
        );
      }
      if (familyTab === "PENDENTES") {
        if (hw.type === "MATERIAL") return false;
        return (
          hw.studentSubmissions.length === 0 ||
          hw.studentSubmissions.some(
            (s) => s.status === "PENDENTE" || s.status === "ATRASADO"
          )
        );
      }
      return true;
    });
  }, [homeworks, isStaff, classroomFilter, typeFilter, familyTab]);

  async function handleCreateHomework(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: formClassroomId,
          title: formTitle,
          description: formDescription,
          dueDate: formDueDate,
          resourceUrl: formResourceUrl.trim() || null,
          type: formType,
          addToCalendar: formAddToCalendar,
        }),
      });

      if (!res.ok) {
        let message = "Não foi possível publicar a tarefa.";
        try {
          const payload = (await res.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await res.json()) as {
        homework: HomeworkItem;
        calendarEventCreated: boolean;
      };

      setHomeworks((prev) => [payload.homework, ...prev]);
      setIsCreateOpen(false);
      setFormTitle("");
      setFormDescription("");
      setFormResourceUrl("");
      toast.success(
        payload.calendarEventCreated
          ? "Atividade publicada e marcada no Calendário Escolar."
          : "Atividade publicada no mural da turma.",
        "Tarefa criada"
      );
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteHomework(id: string): Promise<void> {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/homework/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível excluir esta atividade.");
        return;
      }
      setHomeworks((prev) => prev.filter((hw) => hw.id !== id));
      toast.success("Atividade removida do mural.");
    } catch {
      toast.error("Falha de conexão ao excluir.");
    } finally {
      setDeletingId(null);
    }
  }

  async function openSubmissionsModal(hw: HomeworkItem): Promise<void> {
    setTrackingHomework(hw);
    setSubmissions([]);
    setIsLoadingSubs(true);
    try {
      const res = await fetch(`/api/homework/${hw.id}/submissions`, {
        cache: "no-store",
      });
      if (!res.ok) {
        toast.error("Não foi possível carregar a lista de entregas.");
        return;
      }
      const data = (await res.json()) as {
        submissions: HomeworkSubmissionDetail[];
      };
      setSubmissions(data.submissions);
      const drafts: Record<string, string> = {};
      for (const s of data.submissions) {
        drafts[s.studentId] = s.teacherFeedback ?? "";
      }
      setFeedbackDrafts(drafts);
    } catch {
      toast.error("Falha de conexão ao carregar entregas.");
    } finally {
      setIsLoadingSubs(false);
    }
  }

  async function handleStaffUpdateSubmission(
    studentId: string,
    status: HomeworkSubmissionStatus
  ): Promise<void> {
    if (!trackingHomework) return;
    setUpdatingStudentId(studentId);
    try {
      const feedback = feedbackDrafts[studentId] ?? "";
      const res = await fetch(
        `/api/homework/${trackingHomework.id}/submissions`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            status,
            teacherFeedback: feedback.trim() || null,
          }),
        }
      );

      if (!res.ok) {
        toast.error("Não foi possível atualizar o status do estudante.");
        return;
      }

      const payload = (await res.json()) as {
        submission: {
          studentId: string;
          status: HomeworkSubmissionStatus;
          teacherFeedback: string | null;
          submittedAt: string | null;
        };
      };

      let nextSubmittedCount = 0;
      setSubmissions((prev) => {
        const updated = prev.map((row) =>
          row.studentId === studentId
            ? {
                ...row,
                status: payload.submission.status,
                teacherFeedback: payload.submission.teacherFeedback,
                submittedAt: payload.submission.submittedAt,
              }
            : row
        );
        nextSubmittedCount = updated.filter(
          (r) => r.status === "ENTREGUE" || r.status === "CONFERIDO"
        ).length;
        return updated;
      });

      setHomeworks((prev) =>
        prev.map((hw) =>
          hw.id === trackingHomework.id
            ? { ...hw, submittedCount: nextSubmittedCount }
            : hw
        )
      );
      toast.success("Entrega atualizada.");
    } catch {
      toast.error("Erro de conexão ao atualizar entrega.");
    } finally {
      setUpdatingStudentId(null);
    }
  }

  async function handleStudentSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    if (!submittingHw || isSubmittingStudent) return;
    setIsSubmittingStudent(true);
    try {
      const res = await fetch(
        `/api/homework/${submittingHw.id}/submissions`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentNote: studentNote.trim() || undefined }),
        }
      );

      if (!res.ok) {
        let message = "Não foi possível registrar a entrega.";
        try {
          const payload = (await res.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await res.json()) as {
        submission: {
          studentId: string;
          status: HomeworkSubmissionStatus;
          studentNote: string | null;
          submittedAt: string | null;
        };
      };

      setHomeworks((prev) =>
        prev.map((hw) => {
          if (hw.id !== submittingHw.id) return hw;
          return {
            ...hw,
            studentSubmissions: hw.studentSubmissions.map((s) =>
              s.studentId === payload.submission.studentId
                ? {
                    ...s,
                    status: payload.submission.status,
                    studentNote: payload.submission.studentNote,
                    submittedAt: payload.submission.submittedAt,
                  }
                : s
            ),
          };
        })
      );

      setSubmittingHw(null);
      setStudentNote("");
      toast.success("Atividade marcada como entregue!", "Entrega registrada");
    } catch {
      toast.error("Falha de conexão ao registrar entrega.");
    } finally {
      setIsSubmittingStudent(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra superior de filtros e acao principal */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-ambient)] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {isStaff ? (
            <div className="flex flex-wrap items-center gap-3">
              <select
                aria-label="Filtrar por turma"
                value={classroomFilter}
                onChange={(e) => setClassroomFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:text-sm"
              >
                <option value="ALL">Todas as turmas</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.subject}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filtrar por tipo"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:text-sm"
              >
                <option value="ALL">Todos os tipos</option>
                {HOMEWORK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {HOMEWORK_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(
                [
                  ["PENDENTES", "Pendentes"],
                  ["ENTREGUES", "Entregues"],
                  ["MATERIAIS", "Materiais"],
                  ["TODOS", "Todos"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFamilyTab(key)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    familyTab === key
                      ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {isStaff && classrooms.length > 0 ? (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--school-primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98] sm:text-sm"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              <span>Nova Tarefa / Material</span>
            </button>
          ) : null}
        </div>
      </section>

      {/* Lista de cards */}
      {filteredHomeworks.length === 0 ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <BookOpenText className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
            Nenhuma atividade encontrada neste filtro
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isStaff
              ? "Publique tarefas, trabalhos ou links de material de apoio para sua turma."
              : "Assim que os professores publicarem tarefas ou materiais, eles aparecerão aqui."}
          </p>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredHomeworks.map((hw) => {
            const ownSub = hw.studentSubmissions[0];
            const isOwnCompleted = Boolean(
              ownSub &&
                (ownSub.status === "ENTREGUE" || ownSub.status === "CONFERIDO")
            );
            const deadline = getDeadlineBadge(hw.dueDate, !isStaff && isOwnCompleted);
            const progressPct =
              hw.totalStudents > 0
                ? Math.round((hw.submittedCount / hw.totalStudents) * 100)
                : 0;

            return (
              <article
                key={hw.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-ambient)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${HOMEWORK_TYPE_STYLES[hw.type]}`}
                      >
                        {HOMEWORK_TYPE_LABELS[hw.type]}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {hw.classroomName} · {hw.classroomSubject}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold ${deadline.className}`}
                    >
                      <Clock className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                      {deadline.label}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
                    {hw.title}
                  </h3>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {hw.description}
                  </p>

                  {hw.resourceUrl ? (
                    <a
                      href={hw.resourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[var(--school-primary)] transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      <span>Abrir Material / Anexo</span>
                    </a>
                  ) : null}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                  {isStaff ? (
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-600 dark:text-slate-400">
                            {hw.submittedCount} de {hw.totalStudents} alunos entregaram
                          </span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {progressPct}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor: "var(--school-primary)",
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Por {hw.authorName} · Prazo {formatIsoDateBr(hw.dueDate)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openSubmissionsModal(hw)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                          >
                            <ClipboardList className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                            <span>Acompanhar Entregas</span>
                          </button>

                          {hw.canManage ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteHomework(hw.id)}
                              disabled={deletingId === hw.id}
                              aria-label={`Excluir ${hw.title}`}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-slate-700 dark:hover:border-red-500/30 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                            >
                              {deletingId === hw.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                              )}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : userRole === "ALUNO" ? (
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${SUBMISSION_STATUS_STYLES[ownSub?.status ?? "PENDENTE"]}`}
                          >
                            {SUBMISSION_STATUS_LABELS[ownSub?.status ?? "PENDENTE"]}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Prof. {hw.authorName}
                          </span>
                        </div>

                        {hw.type !== "MATERIAL" && !isOwnCompleted ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSubmittingHw(hw);
                              setStudentNote(ownSub?.studentNote ?? "");
                            }}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[var(--school-primary-hover)]"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                            <span>Marcar como Concluída / Entregue</span>
                          </button>
                        ) : null}
                      </div>

                      {ownSub?.teacherFeedback ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                          <strong>Feedback do professor: </strong>
                          {ownSub.teacherFeedback}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    // Visao Responsavel
                    <div className="space-y-2">
                      {hw.studentSubmissions.map((sub) => (
                        <div
                          key={sub.studentId}
                          className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs dark:bg-slate-800/60"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {sub.studentName}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 font-semibold ${SUBMISSION_STATUS_STYLES[sub.status]}`}
                            >
                              {SUBMISSION_STATUS_LABELS[sub.status]}
                            </span>
                          </div>
                          {sub.studentNote ? (
                            <p className="mt-1 text-slate-600 dark:text-slate-300">
                              Obs. do estudante: {sub.studentNote}
                            </p>
                          ) : null}
                          {sub.teacherFeedback ? (
                            <p className="mt-1 font-medium text-emerald-700 dark:text-emerald-300">
                              Feedback: {sub.teacherFeedback}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Nova Tarefa / Material (Staff) */}
      {isCreateOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-hw-title"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => setIsCreateOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="new-hw-title"
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                Nova Tarefa ou Material
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Fechar"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Turma
                  </label>
                  <select
                    required
                    value={formClassroomId}
                    onChange={(e) => setFormClassroomId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tipo
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as HomeworkType)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {HOMEWORK_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {HOMEWORK_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Título
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={140}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex.: Lista de exercícios sobre funções do 1º grau"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Data de Entrega / Referência
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Link de Material (opcional)
                  </label>
                  <input
                    type="url"
                    value={formResourceUrl}
                    onChange={(e) => setFormResourceUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Orientações / Descrição
                </label>
                <textarea
                  required
                  rows={4}
                  minLength={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descreva os exercícios, páginas do livro ou instruções de entrega..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={formAddToCalendar}
                  onChange={(e) => setFormAddToCalendar(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-[var(--school-primary)]"
                />
                <CalendarDays className="h-4 w-4 text-[var(--school-primary)] dark:text-blue-400" />
                <span>Marcar também no Calendário Escolar</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--school-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--school-primary-hover)] disabled:opacity-60"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  <span>{isCreating ? "Publicando..." : "Publicar Atividade"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal Acompanhar Entregas (Staff) */}
      {trackingHomework ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="subs-modal-title"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => setTrackingHomework(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="min-w-0">
                <h2
                  id="subs-modal-title"
                  className="truncate text-base font-semibold text-slate-900 dark:text-white"
                >
                  Entregas: {trackingHomework.title}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {trackingHomework.classroomName} · Prazo{" "}
                  {formatIsoDateBr(trackingHomework.dueDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrackingHomework(null)}
                aria-label="Fechar"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rco-thin-scrollbar flex-1 overflow-y-auto p-5">
              {isLoadingSubs ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : (
                <ul className="space-y-3">
                  {submissions.map((sub) => {
                    const isUpdating = updatingStudentId === sub.studentId;
                    return (
                      <li
                        key={sub.studentId}
                        className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={sub.studentName} size="xs" />
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {sub.studentName}
                              </p>
                              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {sub.studentRegistration}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${SUBMISSION_STATUS_STYLES[sub.status]}`}
                          >
                            {SUBMISSION_STATUS_LABELS[sub.status]}
                          </span>
                        </div>

                        {sub.studentNote ? (
                          <p className="mt-2 rounded-lg bg-white px-2.5 py-1.5 text-xs text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                            <strong>Nota do aluno:</strong> {sub.studentNote}
                          </p>
                        ) : null}

                        <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="text"
                            value={feedbackDrafts[sub.studentId] ?? ""}
                            onChange={(e) =>
                              setFeedbackDrafts((prev) => ({
                                ...prev,
                                [sub.studentId]: e.target.value,
                              }))
                            }
                            placeholder="Feedback curto (opcional)"
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(
                              [
                                ["CONFERIDO", "Conferido", "bg-emerald-600 text-white hover:bg-emerald-700"],
                                ["ENTREGUE", "Entregue", "bg-blue-600 text-white hover:bg-blue-700"],
                                ["ATRASADO", "Atrasado", "bg-red-600 text-white hover:bg-red-700"],
                                ["PENDENTE", "Pendente", "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100"],
                              ] as const
                            ).map(([statusKey, label, cls]) => (
                              <button
                                key={statusKey}
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  handleStaffUpdateSubmission(
                                    sub.studentId,
                                    statusKey
                                  )
                                }
                                className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${cls}`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal Marcar como Entregue (Aluno) */}
      {submittingHw ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-sub-title"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => setSubmittingHw(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h2
              id="student-sub-title"
              className="text-base font-semibold text-slate-900 dark:text-white"
            >
              Confirmar entrega da atividade
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {submittingHw.title} ({submittingHw.classroomSubject})
            </p>

            <form onSubmit={handleStudentSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Observação para o professor (opcional)
                </label>
                <textarea
                  rows={3}
                  maxLength={600}
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                  placeholder="Ex.: Entregue no caderno ou enviado pelo Google Drive."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmittingHw(null)}
                  className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStudent}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--school-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--school-primary-hover)] disabled:opacity-60"
                >
                  {isSubmittingStudent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>
                    {isSubmittingStudent ? "Enviando..." : "Confirmar Entrega"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
