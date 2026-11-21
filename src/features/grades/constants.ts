import type { AcademicTerm } from "./types";

export const TERM_LABELS: Record<AcademicTerm, string> = {
  1: "1º Trimestre",
  2: "2º Trimestre",
  3: "3º Trimestre",
};

/** Media minima escolar para aprovacao (6.0 em escala de 0 a 10). */
export const PASSING_GRADE_THRESHOLD = 6.0;

export function formatScoreBr(score: number | null): string {
  if (score === null) {
    return "-";
  }
  return score.toFixed(1).replace(".", ",");
}
