import type { AcademicTerm, StudentFinalStatus } from "./types";

export const TERM_LABELS: Record<AcademicTerm, string> = {
  1: "1º Trimestre",
  2: "2º Trimestre",
  3: "3º Trimestre",
};

/** Media minima escolar para aprovacao (6.0 em escala de 0 a 10). */
export const PASSING_GRADE_THRESHOLD = 6.0;

export const FINAL_STATUS_LABELS: Record<StudentFinalStatus, string> = {
  APROVADO: "Aprovado",
  EM_RECUPERACAO: "Em Recuperação",
  RETIDO: "Retido",
  EM_ANDAMENTO: "Em Andamento",
};

export const FINAL_STATUS_STYLES: Record<StudentFinalStatus, string> = {
  APROVADO:
    "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
  EM_RECUPERACAO:
    "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
  RETIDO:
    "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30",
  EM_ANDAMENTO:
    "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
};

export function formatScoreBr(score: number | null): string {
  if (score === null) {
    return "-";
  }
  return score.toFixed(1).replace(".", ",");
}
