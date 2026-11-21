export const ATTENDANCE_STATUSES = [
  "PRESENTE",
  "FALTA",
  "JUSTIFICADA",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface LessonRecord {
  id: string;
  classroomId: string;
  date: string;
  lessonNumber: number;
  content: string;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStudentRow {
  studentId: string;
  name: string;
  registration: string;
  status: AttendanceStatus;
  attendanceRate: number | null;
  totalRecordedLessons: number;
  presentCount: number;
  absentCount: number;
  justifiedCount: number;
}

export interface AttendanceSheetData {
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  date: string;
  lessonNumber: number;
  lesson: LessonRecord | null;
  students: AttendanceStudentRow[];
}

export interface LessonHistoryItem {
  id: string;
  classroomId: string;
  date: string;
  lessonNumber: number;
  content: string;
  observations: string | null;
  presentCount: number;
  absentCount: number;
  justifiedCount: number;
  totalCount: number;
  updatedAt: string;
}
