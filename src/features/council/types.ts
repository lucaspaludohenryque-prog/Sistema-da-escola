import type { ClassroomShift } from "@/features/classrooms/types";
import type { AcademicTerm } from "@/features/grades/types";
import type { SchoolConfigData } from "@/features/school-config/types";

export interface CouncilAlertStudent {
  studentId: string;
  name: string;
  registration: string;
  termFinalAverage: number | null;
  attendanceRate: number | null;
}

export interface ClassCouncilMinuteData {
  id: string;
  classroomId: string;
  term: AcademicTerm;
  date: string;
  summary: string;
  decisions: string;
  authorName: string;
  updatedAt: string;
}

export interface ClassCouncilPayload {
  school: SchoolConfigData;
  classroom: {
    id: string;
    name: string;
    subject: string;
    year: number;
    shift: ClassroomShift;
    teacherName: string;
  };
  term: AcademicTerm;
  metrics: {
    totalStudents: number;
    belowAverageCount: number;
    lowAttendanceCount: number;
    occurrencesCount: number;
    lessonsCount: number;
  };
  attentionStudents: CouncilAlertStudent[];
  minute: ClassCouncilMinuteData | null;
}
