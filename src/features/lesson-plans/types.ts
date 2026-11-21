import type { AcademicTerm } from "@/features/grades/types";

export type LessonPlanStatus = "PLANEJADO" | "MINISTRADO";

export interface LessonPlanItem {
  id: string;
  classroomId: string;
  term: AcademicTerm;
  plannedDate: string | null;
  topic: string;
  objectives: string | null;
  status: LessonPlanStatus;
  createdAt: string;
  updatedAt: string;
}
