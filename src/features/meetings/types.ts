export const MEETING_MODES = ["PRESENCIAL", "ONLINE"] as const;
export type MeetingMode = (typeof MEETING_MODES)[number];

export const MEETING_STATUSES = [
  "CONVOCADA",
  "CONFIRMADA",
  "REMARCAR",
  "CONCLUIDA",
  "CANCELADA",
] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const MEETING_MODE_LABELS: Record<MeetingMode, string> = {
  PRESENCIAL: "Presencial",
  ONLINE: "Online",
};

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  CONVOCADA: "Convocada",
  CONFIRMADA: "Confirmada",
  REMARCAR: "Pedido de Remarcação",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export const MEETING_STATUS_STYLES: Record<MeetingStatus, string> = {
  CONVOCADA:
    "border border-blue-200/80 bg-blue-50/70 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  CONFIRMADA:
    "border border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  REMARCAR:
    "border border-amber-200/80 bg-amber-50/70 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  CONCLUIDA:
    "border border-zinc-200/80 bg-zinc-50 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300",
  CANCELADA:
    "border border-red-200/80 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
};

export interface MeetingItem {
  id: string;
  title: string;
  studentId: string;
  studentName: string;
  classroomName: string;
  classroomSubject: string;
  guardianId: string;
  guardianName: string;
  organizerId: string;
  organizerName: string;
  date: string;
  time: string;
  mode: MeetingMode;
  locationOrLink: string;
  notes: string | null;
  status: MeetingStatus;
  guardianNote: string | null;
  createdAt: string;
}
