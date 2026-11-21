import type { ClassroomShift } from "@/features/classrooms/types";

export type GateCheckInType = "ENTRADA" | "ATRASO" | "SAIDA";

export interface StudentCardItem {
  studentId: string;
  name: string;
  registration: string;
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  shift: ClassroomShift;
  schoolYear: number;
  schoolName: string;
  schoolCity: string;
  schoolState: string;
  schoolLogoUrl: string | null;
  schoolPrimaryColor: string;
  attendanceRate: number | null;
  qrPayload: string;
}

export interface GateCheckInRecord {
  id: string;
  studentId: string;
  studentName: string;
  registration: string;
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  date: string;
  time: string;
  type: GateCheckInType;
  notes: string | null;
  recordedByName: string;
  createdAt: string;
}

export interface TodayCheckInsSummary {
  totalEntradas: number;
  totalAtrasos: number;
  totalSaidas: number;
}

export interface TodayCheckInsResponse {
  date: string;
  summary: TodayCheckInsSummary;
  items: GateCheckInRecord[];
}

export interface ScanCheckInResponse {
  duplicate: boolean;
  message: string;
  checkIn: GateCheckInRecord;
  guardianNotified: boolean;
  occurrenceCreated: boolean;
  attendanceMarked: boolean;
}
