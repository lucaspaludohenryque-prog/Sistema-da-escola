import type { OccurrenceItem, OccurrenceType } from "@/features/occurrences/types";

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

export interface ClassroomAttendanceChartItem {
  classroomId: string;
  classroomName: string;
  subject: string;
  shortLabel: string;
  attendanceRate: number;
  totalRecords: number;
}

export interface OccurrenceTypeChartItem {
  type: OccurrenceType;
  label: string;
  count: number;
}

export interface DashboardOverviewData {
  counters: DashboardCounters;
  alertStudents: StudentAlertItem[];
  recentOccurrences: OccurrenceItem[];
  attendanceByClassroom: ClassroomAttendanceChartItem[];
  occurrencesByType: OccurrenceTypeChartItem[];
}
