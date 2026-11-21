import type { NotificationType } from "./types";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  FALTA: "Falta",
  OCORRENCIA: "Ocorrência",
  COMUNICADO: "Comunicado",
};

export const NOTIFICATION_TYPE_STYLES: Record<NotificationType, string> = {
  FALTA: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  OCORRENCIA: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
  COMUNICADO: "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200",
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
