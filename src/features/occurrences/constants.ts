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
  LEVE: "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200",
  MEDIA: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
  GRAVE: "bg-red-50 text-red-800 ring-1 ring-inset ring-red-200",
};

export const OCCURRENCE_PRAISE_STYLE =
  "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200";

export const OCCURRENCE_STATUS_STYLES: Record<OccurrenceStatus, string> = {
  PENDENTE: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  RESOLVIDO: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200",
};
