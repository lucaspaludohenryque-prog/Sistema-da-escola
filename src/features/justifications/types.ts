export const JUSTIFICATION_STATUSES = [
  "PENDENTE",
  "APROVADA",
  "RECUSADA",
] as const;

export type JustificationStatus = (typeof JUSTIFICATION_STATUSES)[number];

export const JUSTIFICATION_STATUS_LABELS: Record<JustificationStatus, string> = {
  PENDENTE: "Aguardando Coordenação",
  APROVADA: "Aprovada (FJ)",
  RECUSADA: "Recusada",
};

export const JUSTIFICATION_STATUS_STYLES: Record<JustificationStatus, string> = {
  PENDENTE:
    "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
  APROVADA:
    "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
  RECUSADA:
    "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30",
};

export const JUSTIFICATIONS_UPDATED_EVENT = "rco:justifications-updated";

export interface AbsenceJustificationItem {
  id: string;
  attendanceId: string;
  studentId: string;
  studentName: string;
  studentRegistration: string;
  classroomName: string;
  classroomSubject: string;
  lessonDate: string;
  lessonNumber: number;
  guardianName: string;
  guardianEmail: string;
  reason: string;
  status: JustificationStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}
