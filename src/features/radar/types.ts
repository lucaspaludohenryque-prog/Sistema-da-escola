export type RiskLevel = "CRITICO" | "ATENCAO" | "ESTAVEL";

export interface RadarStudentItem {
  studentId: string;
  studentName: string;
  registration: string;
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  guardianName: string;
  guardianPhone: string;
  attendanceRate: number | null;
  consecutiveAbsences: number;
  overallAverage: number | null;
  pendingGraveOccurrences: number;
  totalNegativeOccurrences: number;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: string[];
  recommendations: string[];
}

export interface RadarAnalyticsPayload {
  schoolName: string;
  summary: {
    criticalCount: number;
    attentionCount: number;
    stableCount: number;
    totalStudents: number;
    averageRiskScore: number;
    schoolAverageGrade: number | null;
  };
  classrooms: Array<{
    id: string;
    name: string;
    subject: string;
  }>;
  students: RadarStudentItem[];
}
