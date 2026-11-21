"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { getTodayIsoDate } from "@/features/attendance/constants";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import { TERM_LABELS } from "../constants";
import type { AcademicTerm, AssessmentItem } from "../types";

interface CreateAssessmentModalProps {
  isOpen: boolean;
  classroomId: string;
  term: AcademicTerm;
  onClose: () => void;
  onCreated: (assessment: AssessmentItem) => void;
}

const INPUT_CLASS =
  "block w-full rounded-lg border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:disabled:bg-white/[0.03]";

export function CreateAssessmentModal({
  isOpen,
  classroomId,
  term,
  onClose,
  onCreated,
}: CreateAssessmentModalProps): React.JSX.Element | null {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => getTodayIsoDate());
  const [maxScore, setMaxScore] = useState("10");
  const [weight, setWeight] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setDate(getTodayIsoDate());
    setMaxScore("10");
    setWeight("1");
    setErrorMessage(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);

    const parsedMax = Number(maxScore.replace(",", "."));
    const parsedWeight = Number(weight.replace(",", "."));

    if (!title.trim() || title.trim().length < 2) {
      setErrorMessage("Informe o título da avaliação (ex: Prova 1).");
      return;
    }

    if (!Number.isFinite(parsedMax) || parsedMax <= 0 || parsedMax > 100) {
      setErrorMessage("Informe um valor máximo válido entre 0,1 e 100.");
      return;
    }

    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0 || parsedWeight > 20) {
      setErrorMessage("Informe um peso válido entre 0,1 e 20.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          term,
          title: title.trim(),
          date,
          maxScore: parsedMax,
          weight: parsedWeight,
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível criar a avaliação.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) {
            message = payload.error;
          }
        } catch {
          // Mantem mensagem padrao.
        }
        setErrorMessage(message);
        return;
      }

      const payload = (await response.json()) as { assessment: AssessmentItem };
      onCreated(payload.assessment);
    } catch {
      setErrorMessage("Falha de conexão com o servidor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-assessment-title"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl ring-1 ring-zinc-200/90 dark:bg-[#131518] dark:ring-white/[0.1]">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200/80 pb-4 dark:border-white/[0.08]">
          <div>
            <h2
              id="create-assessment-title"
              className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
            >
              Nova Avaliação
            </h2>
            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
              Será vinculada ao{" "}
              <strong className="font-medium text-zinc-800 dark:text-zinc-200">
                {TERM_LABELS[term]}
              </strong>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar formulário de nova avaliação"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-[#1A1D21] dark:hover:text-white"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {errorMessage ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-300" strokeWidth={1.75} />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label
              htmlFor="assessment-title"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Título da avaliação
            </label>
            <input
              id="assessment-title"
              type="text"
              required
              disabled={isSubmitting}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex: Prova 1, Trabalho em Grupo"
              className={INPUT_CLASS}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="assessment-date"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Data de aplicação
            </label>
            <input
              id="assessment-date"
              type="date"
              required
              disabled={isSubmitting}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="assessment-max-score"
                className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
              >
                Valor máximo
              </label>
              <input
                id="assessment-max-score"
                type="number"
                min={0.5}
                max={100}
                step="0.5"
                required
                disabled={isSubmitting}
                value={maxScore}
                onChange={(event) => setMaxScore(event.target.value)}
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="assessment-weight"
                className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
              >
                Peso
              </label>
              <input
                id="assessment-weight"
                type="number"
                min={0.1}
                max={20}
                step="0.1"
                required
                disabled={isSubmitting}
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2.5 border-t border-zinc-200/80 pt-4 sm:flex-row sm:justify-end dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200/90 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                  <span>Criando...</span>
                </>
              ) : (
                <span>Criar Avaliação</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
