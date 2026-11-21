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
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/10">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <h2
              id="resolve-occurrence-title"
              className="text-lg font-semibold tracking-tight text-slate-900"
            >
              Resolver / Encaminhar Ocorrência
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Aluno: <strong className="font-medium text-slate-800">{occurrence.student.name}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar janela de encaminhamento"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {errorMessage ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" strokeWidth={1.75} />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label
              htmlFor="resolve-status"
              className="block text-sm font-medium text-slate-800"
            >
              Situação
            </label>
            <select
              id="resolve-status"
              disabled={isSubmitting}
              value={status}
              onChange={(event) => setStatus(event.target.value as OccurrenceStatus)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none"
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
              className="block text-sm font-medium text-slate-800"
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
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
            />
          </div>

          <div className="flex flex-col-reverse gap-2.5 border-t border-slate-200/80 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#1E3A8A] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
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
