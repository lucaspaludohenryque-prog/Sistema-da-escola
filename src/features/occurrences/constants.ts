import type {
  OccurrenceSeverity,
  OccurrenceStatus,
  OccurrenceType,
} from "./types";

export const OCCURRENCE_TYPE_LABELS: Record<OccurrenceType, string> = {
  INDISCIPLINA: "Indisciplina",
  ATRASO: "Atraso",
  SEM_MATERIAL: "Sem material",
  USO_CELULAR: "Uso de celular",
  ELOGIO: "Elogio",
  OUTRO: "Outro",
};

export const OCCURRENCE_SEVERITY_LABELS: Record<OccurrenceSeverity, string> = {
  LEVE: "Leve",
  MEDIA: "Média",
  GRAVE: "Grave",
};

export const OCCURRENCE_STATUS_LABELS: Record<OccurrenceStatus, string> = {
  PENDENTE: "Pendente",
  RESOLVIDO: "Resolvido",
};

export const OCCURRENCE_SEVERITY_STYLES: Record<OccurrenceSeverity, string> = {
  LEVE: "border border-zinc-200/80 bg-zinc-50 text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-300",
  MEDIA:
    "border border-amber-200/80 bg-amber-50/70 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  GRAVE:
    "border border-red-200/80 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
};

export const OCCURRENCE_PRAISE_STYLE =
  "border border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";

export const OCCURRENCE_STATUS_STYLES: Record<OccurrenceStatus, string> = {
  PENDENTE:
    "border border-zinc-200/80 bg-zinc-50 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-300",
  RESOLVIDO:
    "border border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
};
