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
      {/* Cabecalho limpo de pagina + filtros */}
      <header className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
              Central de Avisos Escolares
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Acompanhe notificações automáticas de faltas e ocorrências e confirme sua ciência.
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium tabular-nums ${
              unacknowledgedCount > 0
                ? "border-red-200/80 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                : "border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
            }`}
          >
            <Bell className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>
              {unacknowledgedCount > 0
                ? `${unacknowledgedCount} ${unacknowledgedCount === 1 ? "pendente" : "pendentes"}`
                : "Todos confirmados"}
            </span>
          </span>
        </div>

        <div
          className="flex flex-wrap items-center gap-1.5"
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
                className={`h-8 cursor-pointer rounded-lg border px-3 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-[var(--school-primary)] bg-[var(--school-primary)] text-white"
                    : "border-zinc-200/80 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-[#131518] dark:text-zinc-400 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-200"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </header>

      {errorMessage ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200/90 bg-red-50/70 px-4 py-3 text-sm text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" strokeWidth={1.75} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {filteredNotifications.length === 0 ? (
        <section className="rounded-xl border border-zinc-200/80 bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
            <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Nenhum aviso nesta visualização
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
            Quando a escola registrar uma falta ou ocorrência vinculada ao estudante, o aviso
            aparecerá automaticamente aqui.
          </p>
        </section>
      ) : (
        <section aria-label="Lista de avisos" className="space-y-3">
          {filteredNotifications.map((item) => {
            const isAcknowledged = Boolean(item.acknowledgedAt);
            const isWorking = acknowledgingId === item.id;
            const leftBorderClass =
              item.type === "FALTA"
                ? "border-l-red-500/80"
                : item.type === "OCORRENCIA"
                  ? getOccurrenceAccent(item.title)
                  : "border-l-[var(--school-primary)]";

            const TypeIcon =
              item.type === "FALTA"
                ? ClipboardCheck
                : item.type === "OCORRENCIA"
                  ? FileWarning
                  : Bell;

            return (
              <article
                key={item.id}
                className={`rounded-xl border border-zinc-200/80 border-l-[3px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5 dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none ${leftBorderClass}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${NOTIFICATION_TYPE_STYLES[item.type]}`}
                      >
                        <TypeIcon className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                        {NOTIFICATION_TYPE_LABELS[item.type]}
                      </span>

                      <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                        <Calendar className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                        {formatDateTimeCompactBr(item.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-zinc-900 sm:text-[15px] dark:text-zinc-100">
                      {item.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {item.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        {item.student.classroom.name} · {item.student.classroom.subject}
                      </span>
                      <Link
                        href={`/dashboard/alunos/${item.student.id}/ficha`}
                        className="font-medium text-zinc-700 underline-offset-2 hover:text-[var(--school-primary)] hover:underline dark:text-zinc-300"
                      >
                        Ver ficha do estudante
                      </Link>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center lg:pt-0.5">
                    {isAcknowledged && item.acknowledgedAt ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium tabular-nums text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
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
                        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--school-primary-hover)] disabled:cursor-not-allowed disabled:opacity-65 sm:w-auto"
                      >
                        {isWorking ? (
                          <>
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              strokeWidth={1.75}
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
