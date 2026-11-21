"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  BookMarked,
  Calendar,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { formatIsoDateBr } from "@/features/attendance/constants";
import { SHIFT_LABELS } from "@/features/classrooms/constants";
import type { ApiErrorPayload, ClassroomSummary } from "@/features/classrooms/types";
import { TERM_LABELS } from "@/features/grades/constants";
import { ACADEMIC_TERMS, type AcademicTerm } from "@/features/grades/types";
import { ListRowsSkeleton } from "@/shared/components/Skeleton";
import { useToast } from "@/shared/components/ToastProvider";
import type { LessonPlanItem } from "../types";

interface LessonPlansViewProps {
  classrooms: ClassroomSummary[];
}

const INPUT_CLASS =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400";

export function LessonPlansView({
  classrooms,
}: LessonPlansViewProps): React.JSX.Element {
  const toast = useToast();
  const [selectedClassroomId, setSelectedClassroomId] = useState(
    () => classrooms[0]?.id ?? ""
  );
  const [selectedTerm, setSelectedTerm] = useState<AcademicTerm>(1);
  const [plans, setPlans] = useState<LessonPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [topic, setTopic] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [objectives, setObjectives] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const fetchPlans = useCallback(
    async (classroomId: string, term: AcademicTerm) => {
      if (!classroomId) return;
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          classroomId,
          term: String(term),
        });
        const response = await fetch(`/api/lesson-plans?${params.toString()}`, {
          cache: "no-store",
        });
        if (response.ok) {
          const payload = (await response.json()) as { plans: LessonPlanItem[] };
          setPlans(payload.plans);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedClassroomId) return;
    void fetchPlans(selectedClassroomId, selectedTerm);
  }, [selectedClassroomId, selectedTerm, fetchPlans]);

  async function handleAddTopic(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (topic.trim().length < 3) {
      toast.warning("Informe o tema da aula (mínimo 3 caracteres).");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/lesson-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          term: selectedTerm,
          plannedDate: plannedDate || null,
          topic: topic.trim(),
          objectives: objectives.trim(),
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível adicionar o tópico.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await response.json()) as { plan: LessonPlanItem };
      setPlans((prev) => [...prev, payload.plan]);
      setTopic("");
      setPlannedDate("");
      setObjectives("");
      toast.success("Tópico adicionado ao plano de ensino.");
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleStatus(plan: LessonPlanItem): Promise<void> {
    if (workingId) return;
    const nextStatus =
      plan.status === "MINISTRADO" ? "PLANEJADO" : "MINISTRADO";

    setWorkingId(plan.id);
    try {
      const response = await fetch(`/api/lesson-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        toast.error("Não foi possível atualizar o status do tópico.");
        return;
      }

      const payload = (await response.json()) as { plan: LessonPlanItem };
      setPlans((prev) =>
        prev.map((item) => (item.id === payload.plan.id ? payload.plan : item))
      );
      toast.success(
        nextStatus === "MINISTRADO"
          ? "Tópico marcado como ministrado."
          : "Tópico reaberto como planejado."
      );
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDelete(planId: string): Promise<void> {
    if (workingId) return;
    setWorkingId(planId);
    try {
      const response = await fetch(`/api/lesson-plans/${planId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error("Não foi possível excluir o tópico.");
        return;
      }
      setPlans((prev) => prev.filter((item) => item.id !== planId));
      toast.success("Tópico removido do planejamento.");
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setWorkingId(null);
    }
  }

  if (classrooms.length === 0) {
    return (
      <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <BookMarked className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          Nenhuma turma disponível para planejamento
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
          Cadastre ou vincule uma turma em Turmas para estruturar o plano de ensino.
        </p>
      </section>
    );
  }

  const taughtCount = plans.filter((p) => p.status === "MINISTRADO").length;
  const progressPercent =
    plans.length > 0 ? Math.round((taughtCount / plans.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Seletores + barra de progresso */}
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.6fr_1fr]">
          <div className="space-y-1.5">
            <label
              htmlFor="plan-classroom"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Turma
            </label>
            <select
              id="plan-classroom"
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className={INPUT_CLASS}
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.subject} ({SHIFT_LABELS[c.shift]} / {c.year})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="plan-term"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Trimestre
            </label>
            <select
              id="plan-term"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(Number(e.target.value) as AcademicTerm)}
              className={INPUT_CLASS}
            >
              {ACADEMIC_TERMS.map((t) => (
                <option key={t} value={t}>
                  {TERM_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-200/80 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-400">
              Progresso do Plano de Ensino ({TERM_LABELS[selectedTerm]})
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {taughtCount}/{plans.length} ministrados ({progressPercent}%)
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[var(--school-primary)] transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Formulario rapido */}
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Adicionar Tópico ao Plano
        </h3>
        <form onSubmit={handleAddTopic} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_0.8fr]">
            <input
              type="text"
              required
              disabled={isCreating}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Tema / conteúdo da aula (ex: Equações do 2º grau e fórmula de Bhaskara)"
              className={INPUT_CLASS}
            />
            <input
              type="date"
              disabled={isCreating}
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              aria-label="Data planejada (opcional)"
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              disabled={isCreating}
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Objetivos de aprendizagem / habilidades BNCC (opcional)"
              className={INPUT_CLASS}
            />
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98] disabled:opacity-70"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" strokeWidth={2} />
              )}
              <span>Adicionar Tópico</span>
            </button>
          </div>
        </form>
      </section>

      {/* Lista de topicos */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
        {isLoading ? (
          <ListRowsSkeleton rows={4} />
        ) : plans.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <BookMarked className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              Nenhum tópico planejado para o {TERM_LABELS[selectedTerm]}
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Adicione acima os conteúdos previstos para acompanhar o andamento e levar direto para
              a chamada.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {plans.map((plan) => {
              const isDone = plan.status === "MINISTRADO";
              const isBusy = workingId === plan.id;

              return (
                <li
                  key={plan.id}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:hover:bg-slate-800/50"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleToggleStatus(plan)}
                      aria-label={
                        isDone
                          ? `Desmarcar ${plan.topic} como ministrado`
                          : `Marcar ${plan.topic} como ministrado`
                      }
                      className={`mt-0.5 shrink-0 cursor-pointer rounded-full transition-colors ${
                        isDone
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400 hover:text-[var(--school-primary)] dark:text-slate-500 dark:hover:text-blue-400"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                      ) : (
                        <Circle className="h-5 w-5" strokeWidth={1.75} />
                      )}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`text-sm font-semibold ${
                            isDone
                              ? "text-slate-500 line-through dark:text-slate-400"
                              : "text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          {plan.topic}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            isDone
                              ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30"
                              : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                          }`}
                        >
                          {isDone ? "Ministrado" : "Planejado"}
                        </span>
                      </div>

                      {plan.objectives ? (
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {plan.objectives}
                        </p>
                      ) : null}

                      {plan.plannedDate ? (
                        <p className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3 w-3" />
                          Previsto para {formatIsoDateBr(plan.plannedDate)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 pl-8 sm:pl-0">
                    <Link
                      href={`/dashboard/chamada?classroomId=${encodeURIComponent(plan.classroomId)}&content=${encodeURIComponent(plan.topic)}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5 text-[var(--school-primary)] dark:text-blue-400" />
                      <span>Usar na Chamada</span>
                    </Link>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleDelete(plan.id)}
                      aria-label={`Excluir tópico ${plan.topic}`}
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
