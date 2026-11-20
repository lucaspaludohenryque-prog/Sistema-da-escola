export const CLASSROOM_SHIFTS = ["MANHA", "TARDE", "NOITE"] as const;

export type ClassroomShift = (typeof CLASSROOM_SHIFTS)[number];

export interface TeacherSummary {
  id: string;
  name: string;
  email: string;
}

export interface ClassroomSummary {
  id: string;
  name: string;
  subject: string;
  year: number;
  shift: ClassroomShift;
  teacherId: string;
  teacher: TeacherSummary;
  studentCount: number;
  createdAt: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  registration: string;
  guardianName: string;
  guardianPhone: string;
  active: boolean;
  classroomId: string;
  createdAt: string;
}

export interface ClassroomDetail {
  id: string;
  name: string;
  subject: string;
  year: number;
  shift: ClassroomShift;
  teacherId: string;
  teacher: TeacherSummary;
  students: StudentRecord[];
  createdAt: string;
}

export interface ApiErrorPayload {
  error: string;
  code:
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "VALIDATION_ERROR"
    | "CONFLICT"
    | "INTERNAL_ERROR";
}
