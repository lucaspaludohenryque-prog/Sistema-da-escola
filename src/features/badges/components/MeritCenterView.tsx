"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Award,
  Loader2,
  Medal,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import { Avatar } from "@/shared/components/Avatar";
import { Skeleton } from "@/shared/components/Skeleton";
import { useToast } from "@/shared/components/ToastProvider";
import {
  BADGE_CATEGORIES,
  BADGE_CATEGORY_META,
  type BadgeCategory,
  type BadgeSuggestionItem,
  type StudentBadgeItem,
} from "../types";

interface ClassroomWithStudentsOption {
  id: string;
  name: string;
  subject: string;
  students: Array<{ id: string; name: string; registration: string }>;
}

interface MeritCenterViewProps {
  initialBadges: StudentBadgeItem[];
  classrooms: ClassroomWithStudentsOption[];
}

export function MeritCenterView({
  initialBadges,
  classrooms,
}: MeritCenterViewProps): React.JSX.Element {
  const toast = useToast();
  const [badges, setBadges] = useState<StudentBadgeItem[]>(initialBadges);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(
    classrooms[0]?.id ?? ""
  );
  const [suggestions, setSuggestions] = useState<BadgeSuggestionItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [awardingKey, setAwardingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal manual
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formClassroomId, setFormClassroomId] = useState<string>(
    classrooms[0]?.id ?? ""
  );
  const [formStudentId, setFormStudentId] = useState<string>(
    classrooms[0]?.students[0]?.id ?? ""
  );
  const [formCategory, setFormCategory] =
    useState<BadgeCategory>("DESTAQUE_ACADEMICO");
  const [formTitle, setFormTitle] = useState<string>(
    BADGE_CATEGORY_META.DESTAQUE_ACADEMICO.defaultTitle
  );
  const [formReason, setFormReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedFormClassroom = useMemo(
    () => classrooms.find((c) => c.id === formClassroomId) ?? classrooms[0],
    [classrooms, formClassroomId]
  );

  const loadSuggestions = useCallback(async (classroomId: string) => {
    if (!classroomId) {
      setSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const res = await fetch(
        `/api/badges/suggestions?classroomId=${encodeURIComponent(classroomId)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = (await res.json()) as {
          suggestions: BadgeSuggestionItem[];
        };
        setSuggestions(data.suggestions);
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassroomId) {
      void loadSuggestions(selectedClassroomId);
    }
  }, [selectedClassroomId, loadSuggestions]);

  async function handleQuickAward(
    suggestion: BadgeSuggestionItem
  ): Promise<void> {
    const key = `${suggestion.studentId}:${suggestion.category}`;
    setAwardingKey(key);
    try {
      const res = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: suggestion.studentId,
          category: suggestion.category,
          title: suggestion.suggestedTitle,
          reason: suggestion.suggestedReason,
        }),
      });

      if (!res.ok) {
        toast.error("Não foi possível conceder a medalha.");
        return;
      }

      const payload = (await res.json()) as { badge: StudentBadgeItem };
      setBadges((prev) => [payload.badge, ...prev]);
      setSuggestions((prev) =>
        prev.filter(
          (s) =>
            !(
              s.studentId === suggestion.studentId &&
              s.category === suggestion.category
            )
        )
      );
      toast.success(
        `Medalha concedida a ${suggestion.studentName} e notificação enviada à família!`,
        "Reconhecimento registrado"
      );
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setAwardingKey(null);
    }
  }

  async function handleManualAward(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: formStudentId,
          category: formCategory,
          title: formTitle,
          reason: formReason,
        }),
      });

      if (!res.ok) {
        let message = "Não foi possível conceder a medalha.";
        try {
          const payload = (await res.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await res.json()) as { badge: StudentBadgeItem };
      setBadges((prev) => [payload.badge, ...prev]);
      setIsModalOpen(false);
      setFormReason("");
      toast.success(
        "Medalha concedida e aviso celebrativo enviado à família e ao aluno!",
        "Mérito escolar"
      );
      if (selectedClassroomId) {
        void loadSuggestions(selectedClassroomId);
      }
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteBadge(id: string): Promise<void> {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/badges/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível remover esta medalha.");
        return;
      }
      setBadges((prev) => prev.filter((b) => b.id !== id));
      toast.success("Medalha removida.");
    } catch {
      toast.error("Falha de conexão ao remover medalha.");
    } finally {
      setDeletingId(null);
    }
  }

  const visibleBadges = useMemo(() => {
    if (!selectedClassroomId || selectedClassroomId === "ALL") return badges;
    return badges.filter((b) => b.classroomId === selectedClassroomId);
  }, [badges, selectedClassroomId]);

  return (
    <div className="space-y-6">
      {/* Barra superior */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-ambient)] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Selecionar turma"
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.subject}
                </option>
              ))}
            </select>
          </div>

          {classrooms.length > 0 ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--school-primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98] sm:text-sm"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              <span>Conceder Medalha</span>
            </button>
          ) : null}
        </div>
      </section>

      {/* Sugestoes Automaticas da IA Pedagogica */}
      <section className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-white p-5 shadow-[var(--shadow-ambient)] dark:border-amber-500/30 dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 ring-1 ring-inset ring-amber-500/30 dark:text-amber-300">
              <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 sm:text-base dark:text-white">
                Sugestões Automáticas da IA Pedagógica
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Estudantes elegíveis por assiduidade 100% (3+ aulas) ou média geral acima de 8,5 no mês
              </p>
            </div>
          </div>
        </div>

        {isLoadingSuggestions ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : suggestions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-amber-200/80 bg-white/70 px-4 py-6 text-center text-xs text-slate-500 dark:border-amber-500/20 dark:bg-slate-900/50 dark:text-slate-400">
            Nenhuma nova sugestão pendente nesta turma no momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {suggestions.map((sug) => {
              const key = `${sug.studentId}:${sug.category}`;
              const isAwarding = awardingKey === key;
              return (
                <div
                  key={key}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={sug.studentName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {sug.studentName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {BADGE_CATEGORY_META[sug.category].label} ·{" "}
                        <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                          {sug.metricLabel}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isAwarding}
                    onClick={() => handleQuickAward(sug)}
                    className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 shadow-xs transition-colors hover:bg-amber-600 disabled:opacity-60"
                  >
                    {isAwarding ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Award className="h-3.5 w-3.5" strokeWidth={2} />
                    )}
                    <span>Conceder Medalha</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Estante de medalhas concedidas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Medalhas Concedidas ({visibleBadges.length})
          </h2>
        </div>

        {visibleBadges.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
              <Trophy className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
              Nenhuma medalha registrada nesta turma ainda
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Reconheça conquistas acadêmicas, frequência exemplar ou liderança positiva.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleBadges.map((badge) => {
              const meta = BADGE_CATEGORY_META[badge.category];
              return (
                <article
                  key={badge.id}
                  className={`flex flex-col justify-between rounded-2xl border p-5 shadow-xs ${meta.cardClass}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${meta.iconWrapClass}`}
                      >
                        <Medal className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                      </div>
                      {badge.canDelete ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteBadge(badge.id)}
                          disabled={deletingId === badge.id}
                          aria-label={`Remover medalha ${badge.title}`}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/80 hover:text-red-600 dark:hover:bg-slate-800"
                        >
                          {deletingId === badge.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                          )}
                        </button>
                      ) : null}
                    </div>

                    <p className="mt-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      {meta.label}
                    </p>
                    <h3 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                      {badge.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      {badge.reason}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-xs dark:border-white/10">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar name={badge.studentName} size="xs" />
                      <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                        {badge.studentName}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                      Por {badge.awardedByName}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Conceder Medalha Manualmente */}
      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="award-badge-title"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="award-badge-title"
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                Conceder Medalha de Mérito
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleManualAward} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Turma
                  </label>
                  <select
                    value={formClassroomId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setFormClassroomId(nextId);
                      const cls = classrooms.find((c) => c.id === nextId);
                      setFormStudentId(cls?.students[0]?.id ?? "");
                    }}
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
                    Estudante
                  </label>
                  <select
                    required
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {(selectedFormClassroom?.students ?? []).map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value as BadgeCategory;
                      setFormCategory(cat);
                      setFormTitle(BADGE_CATEGORY_META[cat].defaultTitle);
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {BADGE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {BADGE_CATEGORY_META[c].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Título da Medalha
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={100}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Motivo do Reconhecimento
                </label>
                <textarea
                  required
                  rows={3}
                  minLength={5}
                  maxLength={500}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Ex.: Destacou-se ajudando colegas durante a oficina de resolução de problemas."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formStudentId}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--school-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--school-primary-hover)] disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Award className="h-4 w-4" />
                  )}
                  <span>{isSubmitting ? "Concedendo..." : "Conceder Medalha"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
