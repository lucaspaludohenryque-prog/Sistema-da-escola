export const BADGE_CATEGORIES = [
  "FREQUENCIA_100",
  "DESTAQUE_ACADEMICO",
  "EVOLUCAO",
  "COLABORACAO",
  "LIDERANCA",
] as const;

export type BadgeCategory = (typeof BADGE_CATEGORIES)[number];

export const BADGE_CATEGORY_META: Record<
  BadgeCategory,
  {
    label: string;
    defaultTitle: string;
    cardClass: string;
    iconWrapClass: string;
  }
> = {
  FREQUENCIA_100: {
    label: "Frequência 100%",
    defaultTitle: "Assiduidade Exemplar",
    cardClass:
      "border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10",
    iconWrapClass:
      "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  },
  DESTAQUE_ACADEMICO: {
    label: "Destaque Acadêmico",
    defaultTitle: "Excelência Acadêmica",
    cardClass:
      "border-amber-200/80 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10",
    iconWrapClass:
      "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  },
  EVOLUCAO: {
    label: "Evolução Contínua",
    defaultTitle: "Superação e Evolução",
    cardClass:
      "border-blue-200/80 bg-blue-50/60 dark:border-blue-500/30 dark:bg-blue-500/10",
    iconWrapClass:
      "bg-blue-500/15 text-blue-700 ring-blue-500/30 dark:text-blue-300",
  },
  COLABORACAO: {
    label: "Colaboração",
    defaultTitle: "Espírito Colaborativo",
    cardClass:
      "border-purple-200/80 bg-purple-50/60 dark:border-purple-500/30 dark:bg-purple-500/10",
    iconWrapClass:
      "bg-purple-500/15 text-purple-700 ring-purple-500/30 dark:text-purple-300",
  },
  LIDERANCA: {
    label: "Liderança Positiva",
    defaultTitle: "Liderança em Sala",
    cardClass:
      "border-rose-200/80 bg-rose-50/60 dark:border-rose-500/30 dark:bg-rose-500/10",
    iconWrapClass:
      "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300",
  },
};

export interface StudentBadgeItem {
  id: string;
  studentId: string;
  studentName: string;
  studentRegistration: string;
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  category: BadgeCategory;
  title: string;
  reason: string;
  awardedById: string;
  awardedByName: string;
  canDelete: boolean;
  createdAt: string;
}

export interface BadgeSuggestionItem {
  studentId: string;
  studentName: string;
  studentRegistration: string;
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  category: BadgeCategory;
  suggestedTitle: string;
  suggestedReason: string;
  metricLabel: string;
}
