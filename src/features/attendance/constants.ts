import type { AttendanceStatus } from "./types";

export const LESSON_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

/** Limite legal de frequencia escolar (75%). Abaixo disso o aluno recebe alerta visual. */
export const LOW_ATTENDANCE_THRESHOLD = 75;

export const ATTENDANCE_STATUS_META: Record<
  AttendanceStatus,
  {
    shortLabel: string;
    label: string;
    activeClass: string;
    idleClass: string;
  }
> = {
  PRESENTE: {
    shortLabel: "P",
    label: "Presente",
    activeClass:
      "border border-emerald-600/90 bg-emerald-600 text-white dark:border-emerald-500/80 dark:bg-emerald-600/90 dark:text-white",
    idleClass:
      "border border-zinc-200/90 bg-white text-zinc-600 hover:border-emerald-300 hover:bg-emerald-50/70 hover:text-emerald-800 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-300 dark:hover:border-emerald-500/35 dark:hover:bg-emerald-500/12 dark:hover:text-emerald-300",
  },
  FALTA: {
    shortLabel: "F",
    label: "Falta",
    activeClass:
      "border border-red-600/90 bg-red-600 text-white dark:border-red-500/80 dark:bg-red-600/90 dark:text-white",
    idleClass:
      "border border-zinc-200/90 bg-white text-zinc-600 hover:border-red-300 hover:bg-red-50/70 hover:text-red-800 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-300 dark:hover:border-red-500/35 dark:hover:bg-red-500/12 dark:hover:text-red-300",
  },
  JUSTIFICADA: {
    shortLabel: "FJ",
    label: "Falta Justificada",
    activeClass:
      "border border-amber-500/90 bg-amber-500/90 text-zinc-950 dark:border-amber-400/80 dark:bg-amber-500/85 dark:text-zinc-950",
    idleClass:
      "border border-zinc-200/90 bg-white text-zinc-600 hover:border-amber-300 hover:bg-amber-50/70 hover:text-amber-900 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-300 dark:hover:border-amber-500/35 dark:hover:bg-amber-500/12 dark:hover:text-amber-300",
  },
};

export function formatIsoDateBr(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) {
    return isoDate;
  }
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
