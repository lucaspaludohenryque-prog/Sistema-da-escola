"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Calendar,
  Loader2,
  Megaphone,
  Pin,
  PinOff,
  Plus,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import type { ApiErrorPayload, ClassroomSummary } from "@/features/classrooms/types";
import { formatDateTimeCompactBr } from "@/features/notifications/constants";
import { useToast } from "@/shared/components/ToastProvider";
import {
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_PRIORITY_LABELS,
  ANNOUNCEMENT_PRIORITY_STYLES,
  type AnnouncementItem,
  type AnnouncementPriority,
} from "../types";

interface AnnouncementsViewProps {
  initialAnnouncements: AnnouncementItem[];
  classrooms: ClassroomSummary[];
  canCreate: boolean;
  canCreateGlobal: boolean;
}

type ScopeFilter = "ALL" | "SCHOOL" | "CLASSROOM";

const INPUT_CLASS =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400";

export function AnnouncementsView({
  initialAnnouncements,
  classrooms,
  canCreate,
  canCreateGlobal,
}: AnnouncementsViewProps): React.JSX.Element {
  const toast = useToast();
  const [announcements, setAnnouncements] =
    useState<AnnouncementItem[]>(initialAnnouncements);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("NORMAL");
  const [pinned, setPinned] = useState(false);
  const [classroomId, setClassroomId] = useState(
    () => (canCreateGlobal ? "" : classrooms[0]?.id ?? "")
  );
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return announcements
      .filter((item) => {
        if (scopeFilter === "SCHOOL") return item.classroomId === null;
        if (scopeFilter === "CLASSROOM") return item.classroomId !== null;
        return true;
      })
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [announcements, scopeFilter]);

  function openModal(): void {
    setTitle("");
    setContent("");
    setPriority("NORMAL");
    setPinned(false);
    setClassroomId(canCreateGlobal ? "" : classrooms[0]?.id ?? "");
    setIsModalOpen(true);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (title.trim().length < 3 || content.trim().length < 5) {
      toast.warning("Preencha o título e o conteúdo do comunicado.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          priority,
          pinned: canCreateGlobal ? pinned : false,
          classroomId: classroomId || null,
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível publicar o comunicado.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await response.json()) as { announcement: AnnouncementItem };
      setAnnouncements((prev) => [payload.announcement, ...prev]);
      setIsModalOpen(false);
      toast.success(
        "Comunicado publicado no mural e enviado aos avisos das famílias.",
        "Comunicado publicado"
      );
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTogglePin(item: AnnouncementItem): Promise<void> {
    if (busyId) return;
    setBusyId(item.id);
    try {
      const response = await fetch(`/api/announcements/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !item.pinned }),
      });
      if (!response.ok) {
        toast.error("Não foi possível atualizar o destaque do comunicado.");
        return;
      }
      const payload = (await response.json()) as { pinned: boolean };
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, pinned: payload.pinned } : a))
      );
      toast.success(
        payload.pinned ? "Comunicado fixado no topo." : "Comunicado desafixado."
      );
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: AnnouncementItem): Promise<void> {
    if (busyId) return;
    setBusyId(item.id);
    try {
      const response = await fetch(`/api/announcements/${item.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error("Não foi possível excluir o comunicado.");
        return;
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
      toast.success("Comunicado removido do mural.");
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
              Mural de Comunicados Oficiais
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Avisos institucionais da escola e recados direcionados por turma.
            </p>
          </div>

          {canCreate && (canCreateGlobal || classrooms.length > 0) ? (
            <button
              type="button"
              onClick={openModal}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>Novo Comunicado</span>
            </button>
          ) : null}
        </div>

        <div
          className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-slate-200/80 pt-4 dark:border-slate-800"
          role="group"
          aria-label="Filtrar comunicados"
        >
          {(
            [
              { id: "ALL", label: "Todos" },
              { id: "SCHOOL", label: "Escola" },
              { id: "CLASSROOM", label: "Por Turma" },
            ] as const
          ).map((tab) => {
            const isSelected = scopeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScopeFilter(tab.id)}
                aria-pressed={isSelected}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[var(--school-primary)] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Megaphone className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
            Nenhum comunicado publicado nesta visualização
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
            Comunicados da direção, coordenação e professores aparecerão automaticamente neste
            mural.
          </p>
        </section>
      ) : (
        <section aria-label="Lista de comunicados" className="space-y-4">
          {filtered.map((item) => {
            const borderAccent =
              item.priority === "URGENTE"
                ? "border-l-red-600"
                : item.priority === "IMPORTANTE"
                  ? "border-l-amber-500"
                  : "border-l-[var(--school-primary)]";

            return (
              <article
                key={item.id}
                className={`rounded-2xl border-l-4 bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 sm:p-6 dark:bg-slate-900 ${borderAccent} ${
                  item.pinned
                    ? "ring-[var(--school-primary-soft-border)] dark:ring-blue-500/40"
                    : "ring-slate-900/[0.06] dark:ring-slate-800"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.pinned ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                          <Pin className="h-3 w-3" strokeWidth={2} />
                          Fixado
                        </span>
                      ) : null}
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${ANNOUNCEMENT_PRIORITY_STYLES[item.priority]}`}
                      >
                        {ANNOUNCEMENT_PRIORITY_LABELS[item.priority]}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Users className="h-3 w-3" />
                        {item.classroomLabel ?? "Toda a escola"}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 sm:text-lg dark:text-slate-100">
                      {item.title}
                    </h3>

                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {item.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {item.authorName}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateTimeCompactBr(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  {item.canManage ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void handleTogglePin(item)}
                        title={item.pinned ? "Desafixar" : "Fixar no topo"}
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-[var(--school-primary)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        {item.pinned ? (
                          <PinOff className="h-4 w-4" strokeWidth={1.75} />
                        ) : (
                          <Pin className="h-4 w-4" strokeWidth={1.75} />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void handleDelete(item)}
                        title="Excluir comunicado"
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Modal Novo Comunicado */}
      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcement-modal-title"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => {
              if (!isSaving) setIsModalOpen(false);
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-slate-700">
            <div className="flex items-start justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
              <div>
                <h3
                  id="announcement-modal-title"
                  className="text-lg font-semibold text-slate-900 dark:text-slate-100"
                >
                  Novo Comunicado
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Os responsáveis vinculados receberão um aviso automático no sininho.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="ann-title"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  Título
                </label>
                <input
                  id="ann-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reunião de Pais e Entrega de Boletins"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="ann-priority"
                    className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    Prioridade
                  </label>
                  <select
                    id="ann-priority"
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as AnnouncementPriority)
                    }
                    className={INPUT_CLASS}
                  >
                    {ANNOUNCEMENT_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {ANNOUNCEMENT_PRIORITY_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="ann-scope"
                    className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    Destinatários
                  </label>
                  <select
                    id="ann-scope"
                    required={!canCreateGlobal}
                    value={classroomId}
                    onChange={(e) => setClassroomId(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    {canCreateGlobal ? (
                      <option value="">Toda a escola</option>
                    ) : null}
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.subject}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="ann-content"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  Mensagem do Comunicado
                </label>
                <textarea
                  id="ann-content"
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva as orientações completas para famílias, alunos e equipe..."
                  className={INPUT_CLASS}
                />
              </div>

              {canCreateGlobal ? (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 ring-1 ring-inset ring-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--school-primary)]"
                  />
                  <span>Fixar comunicado no topo do mural</span>
                </label>
              ) : null}

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
                  <span>Publicar Comunicado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
