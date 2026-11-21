export const ACADEMIC_TERMS = [1, 2, 3] as const;

export type AcademicTerm = (typeof ACADEMIC_TERMS)[number];

export type StudentFinalStatus =
  | "APROVADO"
  | "EM_RECUPERACAO"
  | "RETIDO"
  | "EM_ANDAMENTO";

export interface AssessmentItem {
  id: string;
  classroomId: string;
  title: string;
  term: AcademicTerm;
  maxScore: number;
  weight: number;
  date: string;
  createdAt: string;
}

export interface GradeStudentRow {
  studentId: string;
  name: string;
  registration: string;
  scores: Record<string, number | null>;
  termAverage: number | null;
  recoveryScore: number | null;
  finalTermAverage: number | null;
  termFinals: Record<AcademicTerm, number | null>;
  annualAverage: number | null;
  attendanceRate: number | null;
  finalStatus: StudentFinalStatus;
}

export interface GradeSheetData {
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  term: AcademicTerm;
  isLocked: boolean;
  lockedAt: string | null;
  assessments: AssessmentItem[];
  students: GradeStudentRow[];
}
