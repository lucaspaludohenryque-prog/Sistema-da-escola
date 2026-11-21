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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
            Mérito e Reconhecimento Escolar
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Conceda distinções por assiduidade, desempenho acadêmico e convivência positiva.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Selecionar turma"
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="h-9 rounded-lg border border-zinc-200/90 bg-white px-3 text-sm font-medium text-zinc-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#131518] dark:text-zinc-100"
          >
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.subject}
              </option>
            ))}
          </select>

          {classrooms.length > 0 ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[var(--school-primary-hover)]"
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Conceder Medalha</span>
            </button>
          ) : null}
        </div>
      </header>

      {/* Sugestoes Automaticas */}
      <section className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-zinc-200/70 pb-3 dark:border-white/[0.07]">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Sugestões Elegíveis da Turma
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Estudantes com 100% de presença (3+ aulas) ou média geral acima de 8,5 no período
            </p>
          </div>
          <Sparkles className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
        </div>

        {isLoadingSuggestions ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        ) : suggestions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-6 text-center text-xs text-zinc-500 dark:border-white/[0.08] dark:bg-[#0C0D0F]/50 dark:text-zinc-400">
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
                  className="flex flex-col justify-between gap-3 rounded-lg border border-zinc-200/80 bg-zinc-50/60 p-3.5 sm:flex-row sm:items-center dark:border-white/[0.08] dark:bg-[#1A1D21]/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={sug.studentName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {sug.studentName}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {BADGE_CATEGORY_META[sug.category].label} ·{" "}
                        <span className="font-mono font-medium tabular-nums text-amber-700 dark:text-amber-400">
                          {sug.metricLabel}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isAwarding}
                    onClick={() => handleQuickAward(sug)}
                    className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-white/[0.09] dark:bg-[#131518] dark:text-zinc-100 dark:hover:bg-white/[0.08]"
                  >
                    {isAwarding ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Award className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
                    )}
                    <span>Conceder</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Estante sobria de medalhas concedidas */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Reconhecimentos Concedidos ({visibleBadges.length})
          </h3>
        </div>

        {visibleBadges.length === 0 ? (
          <div className="rounded-xl border border-zinc-200/80 bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
              <Trophy className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h4 className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Nenhum reconhecimento registrado nesta turma ainda
            </h4>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Reconheça conquistas acadêmicas, frequência exemplar ou liderança positiva.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {visibleBadges.map((badge) => {
              const meta = BADGE_CATEGORY_META[badge.category];
              return (
                <article
                  key={badge.id}
                  className="flex flex-col justify-between rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200/80 bg-amber-50/70 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                          <Medal className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                        </div>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {meta.label}
                        </span>
                      </div>
                      {badge.canDelete ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteBadge(badge.id)}
                          disabled={deletingId === badge.id}
                          aria-label={`Remover medalha ${badge.title}`}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-[#1A1D21] dark:hover:text-red-400"
                        >
                          {deletingId === badge.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                          )}
                        </button>
                      ) : null}
                    </div>

                    <h4 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {badge.title}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {badge.reason}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-zinc-200/70 pt-3 text-xs dark:border-white/[0.07]">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar name={badge.studentName} size="xs" />
                      <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                        {badge.studentName}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11px] text-zinc-400 dark:text-zinc-500">
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
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-200/90 bg-white p-6 shadow-[var(--shadow-popover)] dark:border-white/10 dark:bg-[#131518]">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-200/80 pb-3.5 dark:border-white/[0.08]">
              <h2
                id="award-badge-title"
                className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Conceder Medalha de Mérito
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleManualAward} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
                    className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Estudante
                  </label>
                  <select
                    required
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
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
                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value as BadgeCategory;
                      setFormCategory(cat);
                      setFormTitle(BADGE_CATEGORY_META[cat].defaultTitle);
                    }}
                    className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
                  >
                    {BADGE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {BADGE_CATEGORY_META[c].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Título da Medalha
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={100}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
                  className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-200/80 pt-4 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 cursor-pointer rounded-lg border border-zinc-200/90 bg-white px-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formStudentId}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3.5 text-sm font-medium text-white hover:bg-[var(--school-primary-hover)] disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Award className="h-4 w-4" strokeWidth={1.75} />
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
