import type { GateCheckInType } from "./types";

export const CARD_QR_PREFIX = "RCO-CARD:";

export const GATE_CHECKIN_TYPE_LABELS: Record<GateCheckInType, string> = {
  ENTRADA: "Entrada",
  ATRASO: "Atraso",
  SAIDA: "Saída",
};

export const GATE_CHECKIN_BADGE_STYLES: Record<GateCheckInType, string> = {
  ENTRADA:
    "border border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-300",
  ATRASO:
    "border border-amber-200/90 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/12 dark:text-amber-300",
  SAIDA:
    "border border-zinc-200/90 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300",
};

export function buildStudentCardQrPayload(studentId: string): string {
  return `${CARD_QR_PREFIX}${studentId}`;
}

export function parseScannedCode(
  rawCode: string
): { kind: "studentId" | "registration"; value: string } | null {
  const trimmed = rawCode.trim();
  if (!trimmed) {
    return null;
  }

  const upper = trimmed.toUpperCase();
  if (upper.startsWith(CARD_QR_PREFIX)) {
    const extractedId = trimmed.slice(CARD_QR_PREFIX.length).trim();
    if (!extractedId) {
      return null;
    }
    return { kind: "studentId", value: extractedId };
  }

  return { kind: "registration", value: trimmed };
}

/**
 * Retorna data (YYYY-MM-DD) e horario (HH:mm) atuais no fuso America/Sao_Paulo.
 */
export function getSaoPauloDateTime(now: Date = new Date()): {
  date: string;
  time: string;
} {
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const date = dateFormatter.format(now);
  const rawTime = timeFormatter.format(now);
  // Alguns runtimes retornam "24:xx" a meia-noite; normaliza para "00:xx"
  const time = rawTime.startsWith("24:") ? `00:${rawTime.slice(3)}` : rawTime;

  return { date, time };
}
