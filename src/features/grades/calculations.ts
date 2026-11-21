import { LOW_ATTENDANCE_THRESHOLD } from "@/features/attendance/constants";
import { PASSING_GRADE_THRESHOLD } from "./constants";
import type { StudentFinalStatus } from "./types";

export interface WeightedScoreItem {
  score: number | null;
  maxScore: number;
  weight: number;
}

/**
 * Calcula a media ponderada na escala 0..10 para as avaliacoes com nota lancada.
 * Quando maxScore e 10.0, equivale exatamente a soma(nota * peso) / soma(peso).
 * Retorna null quando nao ha nenhuma nota lancada.
 */
export function calculateWeightedTermAverage(
  items: WeightedScoreItem[]
): number | null {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const item of items) {
    if (
      item.score === null ||
      Number.isNaN(item.score) ||
      item.maxScore <= 0 ||
      item.weight <= 0
    ) {
      continue;
    }

    const normalizedToTen = (item.score / item.maxScore) * 10;
    weightedSum += normalizedToTen * item.weight;
    totalWeight += item.weight;
  }

  if (totalWeight <= 0) {
    return null;
  }

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

/**
 * Calcula a media final do trimestre considerando a nota de recuperacao paralela:
 * prevalece a maior nota entre a media original e a recuperacao.
 */
export function calculateFinalTermAverage(
  termAverage: number | null,
  recoveryScore: number | null
): number | null {
  if (termAverage !== null && recoveryScore !== null) {
    return Math.round(Math.max(termAverage, recoveryScore) * 10) / 10;
  }
  if (termAverage !== null) {
    return Math.round(termAverage * 10) / 10;
  }
  if (recoveryScore !== null) {
    return Math.round(recoveryScore * 10) / 10;
  }
  return null;
}

/** Calcula a media geral anual a partir das medias finais trimestrais disponiveis. */
export function calculateAnnualAverage(
  termAverages: Array<number | null>
): number | null {
  const valid = termAverages.filter((value): value is number => value !== null);
  if (valid.length === 0) {
    return null;
  }

  const sum = valid.reduce((acc, current) => acc + current, 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

/**
 * Determina a situacao final do estudante com base na media anual e frequencia:
 * - RETIDO se frequencia < 75% (reprovacao por falta) ou media anual < 4.0 ou 3 trimestres fechados com media < 6.0;
 * - APROVADO se media anual >= 6.0 e frequencia >= 75% (ou sem aulas registradas);
 * - EM_RECUPERACAO se media anual < 6.0 com ano em curso;
 * - EM_ANDAMENTO quando ainda nao ha notas lancadas.
 */
export function determineStudentFinalStatus(
  annualAverage: number | null,
  attendanceRate: number | null,
  gradedTermsCount: number
): StudentFinalStatus {
  if (attendanceRate !== null && attendanceRate < LOW_ATTENDANCE_THRESHOLD) {
    return "RETIDO";
  }

  if (annualAverage === null) {
    return "EM_ANDAMENTO";
  }

  if (annualAverage >= PASSING_GRADE_THRESHOLD) {
    return "APROVADO";
  }

  if (annualAverage < 4.0 || gradedTermsCount >= 3) {
    return "RETIDO";
  }

  return "EM_RECUPERACAO";
}
