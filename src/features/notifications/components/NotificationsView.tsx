"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCheck,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  Loader2,
  Users,
} from "lucide-react";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import { useToast } from "@/shared/components/ToastProvider";
import {
  NOTIFICATIONS_UPDATED_EVENT,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_STYLES,
  formatDateTimeCompactBr,
} from "../constants";
import type { NotificationItem } from "../types";

interface NotificationsViewProps {
  initialNotifications: NotificationItem[];
  initialUnacknowledgedCount: number;
}

type NotificationFilter =
  | "ALL"
  | "PENDING"
  | "ACKNOWLEDGED"
  | "FALTA"
  | "OCORRENCIA";

const FILTER_OPTIONS: Array<{ id: NotificationFilter; label: string }> = [
  { id: "ALL", label: "Todos" },
  { id: "PENDING", label: "Aguardando Ciência" },
  { id: "ACKNOWLEDGED", label: "Confirmados" },
  { id: "FALTA", label: "Faltas" },
  { id: "OCORRENCIA", label: "Ocorrências" },
];

function getOccurrenceAccent(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("elogio")) {
    return "border-l-emerald-500";
  }
  if (lower.includes("grave")) {
    return "border-l-red-600";
  }
  if (lower.includes("média") || lower.includes("media")) {
    return "border-l-amber-500";
  }
  return "border-l-blue-600";
}

export function NotificationsView({
  initialNotifications,
  initialUnacknowledgedCount,
}: NotificationsViewProps): React.JSX.Element {
  const toast = useToast();
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(
    initialUnacknowledgedCount
  );
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("ALL");
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === "PENDING") return item.acknowledgedAt === null;
      if (activeFilter === "ACKNOWLEDGED") return item.acknowledgedAt !== null;
      if (activeFilter === "FALTA") return item.type === "FALTA";
      if (activeFilter === "OCORRENCIA") return item.type === "OCORRENCIA";
      return true;
    });
  }, [notifications, activeFilter]);

  async function handleAcknowledge(notificationId: string): Promise<void> {
    if (acknowledgingId) return;

    setAcknowledgingId(notificationId);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/acknowledge`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        let message = "Não foi possível confirmar leitura deste aviso.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) {
            message = payload.error;
          }
        } catch {
          // Mantem mensagem padrao.
        }
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      const payload = (await response.json()) as {
        notification: NotificationItem;
        unacknowledgedCount: number;
      };

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === payload.notification.id ? payload.notification : item
        )
      );
      setUnacknowledgedCount(payload.unacknowledgedCount);
      toast.success("Ciência registrada com data e horário.", "Aviso confirmado");

      window.dispatchEvent(
        new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, {
          detail: { unacknowledgedCount: payload.unacknowledgedCount },
        })
      );
    } catch {
      const msg = "Falha de conexão com o servidor. Tente novamente.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setAcknowledgingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
              Central de Avisos Escolares
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Acompanhe notificações automáticas de faltas e ocorrências e confirme sua ciência.
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              unacknowledgedCount > 0
                ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30"
                : "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30"
            }`}
          >
            <Bell className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>
              {unacknowledgedCount > 0
                ? `${unacknowledgedCount} ${unacknowledgedCount === 1 ? "aviso aguardando ciência" : "avisos aguardando ciência"}`
                : "Todos os avisos confirmados"}
            </span>
          </span>
        </div>

        <div
          className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-slate-200/80 pt-4 dark:border-slate-800"
          role="group"
          aria-label="Filtrar avisos"
        >
          {FILTER_OPTIONS.map((option) => {
            const isSelected = activeFilter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setActiveFilter(option.id)}
                aria-pressed={isSelected}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[var(--school-primary)] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      {errorMessage ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-300" strokeWidth={1.75} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {filteredNotifications.length === 0 ? (
        <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Bell className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
            Nenhum aviso nesta visualização
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
            Quando a escola registrar uma falta ou ocorrência vinculada ao estudante, o aviso
            aparecerá automaticamente aqui.
          </p>
        </section>
      ) : (
        <section aria-label="Lista de avisos" className="space-y-4">
          {filteredNotifications.map((item) => {
            const isAcknowledged = Boolean(item.acknowledgedAt);
            const isWorking = acknowledgingId === item.id;
            const leftBorderClass =
              item.type === "FALTA"
                ? "border-l-red-500"
                : item.type === "OCORRENCIA"
                  ? getOccurrenceAccent(item.title)
                  : "border-l-blue-600";

            const TypeIcon =
              item.type === "FALTA"
                ? ClipboardCheck
                : item.type === "OCORRENCIA"
                  ? FileWarning
                  : Bell;

            return (
              <article
                key={item.id}
                className={`rounded-2xl border-l-4 bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800 ${leftBorderClass}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold ${NOTIFICATION_TYPE_STYLES[item.type]}`}
                      >
                        <TypeIcon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        {NOTIFICATION_TYPE_LABELS[item.type]}
                      </span>

                      <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        {formatDateTimeCompactBr(item.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {item.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        {item.student.classroom.name} - {item.student.classroom.subject}
                      </span>
                      <Link
                        href={`/dashboard/alunos/${item.student.id}/ficha`}
                        className="font-medium text-[var(--school-primary)] hover:underline dark:text-blue-400"
                      >
                        Ver ficha do estudante
                      </Link>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center lg:pt-1">
                    {isAcknowledged && item.acknowledgedAt ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30">
                        <CheckCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                        <span>
                          Ciente em{" "}
                          {formatDateTimeCompactBr(item.acknowledgedAt).replace(
                            ", ",
                            " às "
                          )}
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() => handleAcknowledge(item.id)}
                        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--school-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                      >
                        {isWorking ? (
                          <>
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                            <span>Confirmando...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                            <span>Li e estou ciente</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
