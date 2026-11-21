"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  FileCheck2,
  Loader2,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { formatIsoDateBr } from "@/features/attendance/constants";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import { formatDateTimeCompactBr } from "@/features/notifications/constants";
import { Avatar } from "@/shared/components/Avatar";
import { useToast } from "@/shared/components/ToastProvider";
import {
  JUSTIFICATIONS_UPDATED_EVENT,
  JUSTIFICATION_STATUS_LABELS,
  JUSTIFICATION_STATUS_STYLES,
  type AbsenceJustificationItem,
  type JustificationStatus,
} from "../types";

interface JustificationsAdminViewProps {
  initialJustifications: AbsenceJustificationItem[];
  initialPendingCount: number;
}

type StatusTab = "ALL" | JustificationStatus;

export function JustificationsAdminView({
  initialJustifications,
  initialPendingCount,
}: JustificationsAdminViewProps): React.JSX.Element {
  const toast = useToast();
  const [items, setItems] =
    useState<AbsenceJustificationItem[]>(initialJustifications);
  const [pendingCount, setPendingCount] = useState(initialPendingCount);
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (activeTab === "ALL") return items;
    return items.filter((i) => i.status === activeTab);
  }, [items, activeTab]);

  async function handleReview(
    id: string,
    decision: "APROVADA" | "RECUSADA"
  ): Promise<void> {
    if (busyId) return;
    setBusyId(id);
    try {
      const response = await fetch(`/api/justifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decision,
          reviewNote: (notesMap[id] ?? "").trim(),
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível avaliar a justificativa.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await response.json()) as {
        justification: AbsenceJustificationItem;
        pendingCount: number;
      };

      setItems((prev) =>
        prev.map((i) =>
          i.id === payload.justification.id ? payload.justification : i
        )
      );
      setPendingCount(payload.pendingCount);

      window.dispatchEvent(
        new CustomEvent(JUSTIFICATIONS_UPDATED_EVENT, {
          detail: { pendingCount: payload.pendingCount },
        })
      );

      toast.success(
        decision === "APROVADA"
          ? "Justificativa aprovada: falta convertida para FJ e família notificada."
          : "Justificativa recusada e parecer enviado à família."
      );
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-zinc-200/80 sm:p-6 dark:bg-[#131518] dark:ring-white/[0.08]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl dark:text-zinc-100">
              Justificativas de Falta
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Avalie os pedidos enviados pelos responsáveis. Aprovações convertem automaticamente a
              falta para Falta Justificada (FJ).
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              pendingCount > 0
                ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30"
                : "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30"
            }`}
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>
              {pendingCount > 0
                ? `${pendingCount} ${pendingCount === 1 ? "pendente" : "pendentes"}`
                : "Nenhuma pendência"}
            </span>
          </span>
        </div>

        <div
          className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-zinc-200/80 pt-4 dark:border-white/[0.08]"
          role="group"
          aria-label="Filtrar justificativas"
        >
          {(
            [
              { id: "ALL", label: "Todas" },
              { id: "PENDENTE", label: "Pendentes" },
              { id: "APROVADA", label: "Aprovadas" },
              { id: "RECUSADA", label: "Recusadas" },
            ] as const
          ).map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={isSelected}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[var(--school-primary)] text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80 dark:bg-[#1A1D21] dark:text-zinc-300 dark:hover:bg-white/[0.08]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className="rounded-xl bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] ring-1 ring-zinc-200/80 dark:bg-[#131518] dark:ring-white/[0.08]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
            <FileCheck2 className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Nenhuma justificativa nesta visualização
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            Quando um responsável solicitar justificativa de falta pelo Portal da Família, o pedido
            aparecerá aqui.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {filtered.map((item) => {
            const isPending = item.status === "PENDENTE";
            const isBusy = busyId === item.id;

            return (
              <article
                key={item.id}
                className="rounded-xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-zinc-200/80 sm:p-6 dark:bg-[#131518] dark:ring-white/[0.08]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${JUSTIFICATION_STATUS_STYLES[item.status]}`}
                      >
                        {JUSTIFICATION_STATUS_LABELS[item.status]}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                        Falta em {formatIsoDateBr(item.lessonDate)} ({item.lessonNumber}ª aula)
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <Avatar name={item.studentName} size="md" className="mt-0.5" />
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.studentName}{" "}
                          <span className="font-mono text-xs font-normal text-zinc-500 dark:text-zinc-400">
                            {item.studentRegistration}
                          </span>
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {item.classroomName} - {item.classroomSubject}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            Enviado por {item.guardianName} ({item.guardianEmail})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-800 ring-1 ring-inset ring-zinc-200/80 dark:bg-white/[0.04] dark:text-zinc-200 dark:ring-white/[0.1]">
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        Motivo informado pela família:
                      </p>
                      <p className="mt-1 leading-relaxed">{item.reason}</p>
                    </div>

                    {item.reviewNote ? (
                      <div className="rounded-xl bg-blue-50/70 px-4 py-2.5 text-xs text-blue-950 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/30">
                        <span className="font-semibold">Parecer da Coordenação: </span>
                        {item.reviewNote}
                      </div>
                    ) : null}

                    <p className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                      Solicitado em {formatDateTimeCompactBr(item.createdAt)}
                      {item.reviewedAt
                        ? ` · Avaliado em ${formatDateTimeCompactBr(item.reviewedAt)}`
                        : ""}
                    </p>
                  </div>

                  {isPending ? (
                    <div className="flex w-full flex-col gap-2.5 lg:w-80">
                      <input
                        type="text"
                        disabled={isBusy}
                        value={notesMap[item.id] ?? ""}
                        onChange={(e) =>
                          setNotesMap((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="Parecer opcional para a família..."
                        className="block w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleReview(item.id, "APROVADA")}
                          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {isBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          <span>Aprovar (Converter para FJ)</span>
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleReview(item.id, "RECUSADA")}
                          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Recusar</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
