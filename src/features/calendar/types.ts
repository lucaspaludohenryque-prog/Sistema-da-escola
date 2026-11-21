export const SCHOOL_EVENT_TYPES = [
  "PROVA",
  "TRABALHO",
  "FERIADO",
  "REUNIAO",
  "EVENTO",
] as const;

export type SchoolEventType = (typeof SCHOOL_EVENT_TYPES)[number];

export const SCHOOL_EVENT_LABELS: Record<SchoolEventType, string> = {
  PROVA: "Prova",
  TRABALHO: "Trabalho",
  FERIADO: "Feriado",
  REUNIAO: "Reunião",
  EVENTO: "Evento",
};

export const SCHOOL_EVENT_BADGE_STYLES: Record<SchoolEventType, string> = {
  PROVA:
    "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30",
  TRABALHO:
    "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
  FERIADO:
    "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
  REUNIAO:
    "bg-purple-50 text-purple-800 ring-1 ring-inset ring-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:ring-purple-400/30",
  EVENTO:
    "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30",
};

export const SCHOOL_EVENT_PILL_STYLES: Record<SchoolEventType, string> = {
  PROVA: "bg-red-600 text-white",
  TRABALHO: "bg-amber-500 text-slate-950",
  FERIADO: "bg-emerald-600 text-white",
  REUNIAO: "bg-purple-600 text-white",
  EVENTO: "bg-blue-600 text-white",
};

export interface SchoolEventItem {
  id: string;
  title: string;
  description: string | null;
  date: string;
  type: SchoolEventType;
  classroomId: string | null;
  classroomLabel: string | null;
  authorId: string;
  authorName: string;
  canDelete: boolean;
  createdAt: string;
}
