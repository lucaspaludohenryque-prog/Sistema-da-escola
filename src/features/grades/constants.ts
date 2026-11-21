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
    "border border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  EM_RECUPERACAO:
    "border border-amber-200/80 bg-amber-50/70 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  RETIDO:
    "border border-red-200/80 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  EM_ANDAMENTO:
    "border border-zinc-200/80 bg-zinc-50 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400",
};

export function formatScoreBr(score: number | null): string {
  if (score === null) {
    return "-";
  }
  return score.toFixed(1).replace(".", ",");
}
