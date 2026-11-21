export const VERIFICATION_DOC_TYPES = ["BOLETIM", "ATA_CONSELHO"] as const;

export type VerificationDocType = (typeof VERIFICATION_DOC_TYPES)[number];

export interface VerificationSummaryData {
  schoolYear?: number;
  termLabel?: string;
  attendanceRate?: number | null;
  overallAverage?: number | null;
  totalStudents?: number;
  belowAverageCount?: number;
  lowAttendanceCount?: number;
}

export interface PublicVerificationPayload {
  valid: true;
  code: string;
  docType: VerificationDocType;
  title: string;
  subjectName: string;
  classroomName: string;
  summary: VerificationSummaryData;
  issuedByName: string;
  issuedAt: string;
  school: {
    name: string;
    city: string;
    state: string;
    logoUrl: string | null;
    primaryColor: string;
    schoolYear: number;
  };
}
