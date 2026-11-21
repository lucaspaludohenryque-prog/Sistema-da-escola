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
    "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30",
  CONFIRMADA:
    "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
  REMARCAR:
    "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
  CONCLUIDA:
    "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  CANCELADA:
    "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30",
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
