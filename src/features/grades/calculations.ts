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

/** Calcula a media geral anual a partir das medias trimestrais disponiveis. */
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
