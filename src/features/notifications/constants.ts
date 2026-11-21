import type { NotificationType } from "./types";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  FALTA: "Falta",
  OCORRENCIA: "Ocorrência",
  COMUNICADO: "Comunicado",
};

export const NOTIFICATION_TYPE_STYLES: Record<NotificationType, string> = {
  FALTA:
    "border border-red-200/80 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  OCORRENCIA:
    "border border-amber-200/80 bg-amber-50/70 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  COMUNICADO:
    "border border-blue-200/80 bg-blue-50/70 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
};

export const NOTIFICATIONS_UPDATED_EVENT = "rco:notifications-updated";

export function formatDateTimeCompactBr(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDateTimeBr(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
