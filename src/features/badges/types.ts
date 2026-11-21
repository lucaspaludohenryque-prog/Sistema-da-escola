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
      "border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#131518]",
    iconWrapClass:
      "bg-emerald-50/80 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-500/12 dark:text-emerald-300 dark:ring-emerald-500/20",
  },
  DESTAQUE_ACADEMICO: {
    label: "Destaque Acadêmico",
    defaultTitle: "Excelência Acadêmica",
    cardClass:
      "border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#131518]",
    iconWrapClass:
      "bg-amber-50/80 text-amber-700 ring-amber-200/80 dark:bg-amber-500/12 dark:text-amber-300 dark:ring-amber-500/20",
  },
  EVOLUCAO: {
    label: "Evolução Contínua",
    defaultTitle: "Superação e Evolução",
    cardClass:
      "border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#131518]",
    iconWrapClass:
      "bg-blue-50/80 text-blue-700 ring-blue-200/80 dark:bg-blue-500/12 dark:text-blue-300 dark:ring-blue-500/20",
  },
  COLABORACAO: {
    label: "Colaboração",
    defaultTitle: "Espírito Colaborativo",
    cardClass:
      "border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#131518]",
    iconWrapClass:
      "bg-indigo-50/80 text-indigo-700 ring-indigo-200/80 dark:bg-indigo-500/12 dark:text-indigo-300 dark:ring-indigo-500/20",
  },
  LIDERANCA: {
    label: "Liderança Positiva",
    defaultTitle: "Liderança em Sala",
    cardClass:
      "border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#131518]",
    iconWrapClass:
      "bg-rose-50/80 text-rose-700 ring-rose-200/80 dark:bg-rose-500/12 dark:text-rose-300 dark:ring-rose-500/20",
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
