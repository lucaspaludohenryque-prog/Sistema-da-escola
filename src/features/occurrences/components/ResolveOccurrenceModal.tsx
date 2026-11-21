"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import { OCCURRENCE_STATUS_LABELS } from "../constants";
import {
  OCCURRENCE_STATUSES,
  type OccurrenceItem,
  type OccurrenceStatus,
} from "../types";

interface ResolveOccurrenceModalProps {
  occurrence: OccurrenceItem | null;
  onClose: () => void;
  onUpdated: (updated: OccurrenceItem) => void;
}

const INPUT_CLASS =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:disabled:bg-slate-800/50";

export function ResolveOccurrenceModal({
  occurrence,
  onClose,
  onUpdated,
}: ResolveOccurrenceModalProps): React.JSX.Element | null {
  const [status, setStatus] = useState<OccurrenceStatus>("RESOLVIDO");
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!occurrence) return;
    setStatus(occurrence.status === "PENDENTE" ? "RESOLVIDO" : occurrence.status);
    setResolutionNote(occurrence.resolutionNote ?? "");
    setErrorMessage(null);
  }, [occurrence]);

  useEffect(() => {
    if (!occurrence) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [occurrence, isSubmitting, onClose]);

  if (!occurrence) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!occurrence) return;
    setErrorMessage(null);

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/occurrences/${occurrence.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          resolutionNote: resolutionNote.trim(),
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível salvar o encaminhamento.";
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

      const payload = (await response.json()) as { occurrence: OccurrenceItem };
      onUpdated(payload.occurrence);
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
      aria-labelledby="resolve-occurrence-title"
    >
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-slate-700">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
          <div>
            <h2
              id="resolve-occurrence-title"
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
            >
              Resolver / Encaminhar Ocorrência
            </h2>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
              Aluno:{" "}
              <strong className="font-medium text-slate-800 dark:text-slate-200">
                {occurrence.student.name}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar janela de encaminhamento"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
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
              htmlFor="resolve-status"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Situação
            </label>
            <select
              id="resolve-status"
              disabled={isSubmitting}
              value={status}
              onChange={(event) => setStatus(event.target.value as OccurrenceStatus)}
              className={INPUT_CLASS}
            >
              {OCCURRENCE_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {OCCURRENCE_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="resolve-note"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Encaminhamento / Resolução
            </label>
            <textarea
              id="resolve-note"
              rows={4}
              disabled={isSubmitting}
              value={resolutionNote}
              onChange={(event) => setResolutionNote(event.target.value)}
              placeholder="Registre o contato com a família, orientação pedagógica ou providência tomada..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col-reverse gap-2.5 border-t border-slate-200/80 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Encaminhamento</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
