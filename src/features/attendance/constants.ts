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
      "bg-emerald-600 text-white ring-1 ring-inset ring-emerald-700 shadow-xs",
    idleClass:
      "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-emerald-50 hover:text-emerald-800 hover:ring-emerald-300",
  },
  FALTA: {
    shortLabel: "F",
    label: "Falta",
    activeClass: "bg-red-600 text-white ring-1 ring-inset ring-red-700 shadow-xs",
    idleClass:
      "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-red-50 hover:text-red-800 hover:ring-red-300",
  },
  JUSTIFICADA: {
    shortLabel: "FJ",
    label: "Falta Justificada",
    activeClass:
      "bg-amber-500 text-slate-950 ring-1 ring-inset ring-amber-600 shadow-xs",
    idleClass:
      "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-amber-50 hover:text-amber-900 hover:ring-amber-300",
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
