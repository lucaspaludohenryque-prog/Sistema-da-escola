import type { OccurrenceItem } from "@/features/occurrences/types";

export type AlertReason = "LOW_ATTENDANCE" | "LOW_GRADE";

export interface DashboardCounters {
  totalClassrooms: number;
  activeStudentsCount: number;
  pendingOccurrencesCount: number;
  alertStudentsCount: number;
}

export interface StudentAlertItem {
  studentId: string;
  studentName: string;
  registration: string;
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  attendanceRate: number | null;
  overallAverage: number | null;
  reasons: AlertReason[];
}

export interface DashboardOverviewData {
  counters: DashboardCounters;
  alertStudents: StudentAlertItem[];
  recentOccurrences: OccurrenceItem[];
}
