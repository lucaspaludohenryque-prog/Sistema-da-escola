export const ACADEMIC_TERMS = [1, 2, 3] as const;

export type AcademicTerm = (typeof ACADEMIC_TERMS)[number];

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
}

export interface GradeSheetData {
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  term: AcademicTerm;
  assessments: AssessmentItem[];
  students: GradeStudentRow[];
}
