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
    "border border-amber-200/80 bg-amber-50/70 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  APROVADA:
    "border border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  RECUSADA:
    "border border-red-200/80 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
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
