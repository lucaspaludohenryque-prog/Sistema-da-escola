import type { AttendanceStatus } from "@/features/attendance/types";
import type { ClassroomShift } from "@/features/classrooms/types";
import type { JustificationStatus } from "@/features/justifications/types";
import type {
  ReportOccurrenceEntry,
  ReportTermSummary,
} from "@/features/reports/types";

export interface FamilyAbsenceEntry {
  attendanceId: string;
  lessonId: string;
  date: string;
  lessonNumber: number;
  subject: string;
  classroomName: string;
  content: string;
  status: AttendanceStatus;
  justification: {
    id: string;
    status: JustificationStatus;
    reason: string;
    reviewNote: string | null;
  } | null;
}

export interface FamilyStudentOverview {
  student: {
    id: string;
    name: string;
    registration: string;
    guardianName: string;
    guardianPhone: string;
    active: boolean;
    relationship?: string;
  };
  classroom: {
    id: string;
    name: string;
    subject: string;
    year: number;
    shift: ClassroomShift;
    teacherName: string;
  };
  attendance: {
    totalLessons: number;
    presentCount: number;
    absentCount: number;
    justifiedCount: number;
    attendanceRate: number | null;
    absences: FamilyAbsenceEntry[];
  };
  terms: ReportTermSummary[];
  annualAverage: number | null;
  occurrences: ReportOccurrenceEntry[];
}

export interface FamilyOverviewData {
  role: "RESPONSAVEL" | "ALUNO";
  students: FamilyStudentOverview[];
  unacknowledgedCount: number;
}

export interface AdminGuardianLinkItem {
  id: string;
  relationship: string;
  createdAt: string;
  guardian: {
    id: string;
    name: string;
    email: string;
    active: boolean;
  };
  student: {
    id: string;
    name: string;
    registration: string;
    classroom: {
      id: string;
      name: string;
      subject: string;
    };
  };
}

export interface AdminStudentAccountItem {
  userId: string;
  userName: string;
  userEmail: string;
  userActive: boolean;
  linkedStudent: {
    id: string;
    name: string;
    registration: string;
    classroomName: string;
    classroomSubject: string;
  } | null;
}

export interface AdminFamilyLinksPayload {
  guardianLinks: AdminGuardianLinkItem[];
  studentAccounts: AdminStudentAccountItem[];
  availableGuardians: Array<{ id: string; name: string; email: string }>;
  availableStudents: Array<{
    id: string;
    name: string;
    registration: string;
    classroomName: string;
    classroomSubject: string;
    userId: string | null;
  }>;
}
