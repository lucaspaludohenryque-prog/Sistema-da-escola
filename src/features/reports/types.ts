import type { BadgeCategory } from "@/features/badges/types";
import type { ClassroomShift } from "@/features/classrooms/types";
import type { AcademicTerm } from "@/features/grades/types";
import type {
  OccurrenceSeverity,
  OccurrenceStatus,
  OccurrenceType,
} from "@/features/occurrences/types";
import type { SchoolConfigData } from "@/features/school-config/types";

export interface ReportAssessmentGrade {
  assessmentId: string;
  title: string;
  date: string;
  maxScore: number;
  weight: number;
  score: number | null;
}

export interface ReportTermSummary {
  term: AcademicTerm;
  assessments: ReportAssessmentGrade[];
  termAverage: number | null;
}

export interface ReportOccurrenceEntry {
  id: string;
  date: string;
  type: OccurrenceType;
  severity: OccurrenceSeverity;
  status: OccurrenceStatus;
  description: string;
  resolutionNote: string | null;
  authorName: string;
}

export interface ReportBadgeEntry {
  id: string;
  category: BadgeCategory;
  title: string;
  reason: string;
  awardedByName: string;
  createdAt: string;
}

export interface StudentReportData {
  generatedAt: string;
  school: SchoolConfigData;
  student: {
    id: string;
    name: string;
    registration: string;
    guardianName: string;
    guardianPhone: string;
    active: boolean;
    createdAt: string;
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
  };
  terms: ReportTermSummary[];
  annualAverage: number | null;
  occurrences: ReportOccurrenceEntry[];
  badges: ReportBadgeEntry[];
}
