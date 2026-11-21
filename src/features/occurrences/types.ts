import type { UserRole } from "@/features/auth/types";
import type { ClassroomShift } from "@/features/classrooms/types";

export const OCCURRENCE_TYPES = [
  "INDISCIPLINA",
  "ATRASO",
  "SEM_MATERIAL",
  "USO_CELULAR",
  "ELOGIO",
  "OUTRO",
] as const;

export type OccurrenceType = (typeof OCCURRENCE_TYPES)[number];

export const OCCURRENCE_SEVERITIES = ["LEVE", "MEDIA", "GRAVE"] as const;

export type OccurrenceSeverity = (typeof OCCURRENCE_SEVERITIES)[number];

export const OCCURRENCE_STATUSES = ["PENDENTE", "RESOLVIDO"] as const;

export type OccurrenceStatus = (typeof OCCURRENCE_STATUSES)[number];

export type FamilyAcknowledgementStatus =
  | "ACKNOWLEDGED"
  | "PENDING"
  | "NO_GUARDIAN";

export interface OccurrenceFamilyReceipt {
  status: FamilyAcknowledgementStatus;
  acknowledgedAt: string | null;
  acknowledgedByName: string | null;
}

export interface OccurrenceItem {
  id: string;
  studentId: string;
  classroomId: string;
  authorId: string;
  type: OccurrenceType;
  severity: OccurrenceSeverity;
  description: string;
  status: OccurrenceStatus;
  resolutionNote: string | null;
  date: string;
  createdAt: string;
  canDelete: boolean;
  familyReceipt: OccurrenceFamilyReceipt;
  student: {
    id: string;
    name: string;
    registration: string;
  };
  classroom: {
    id: string;
    name: string;
    subject: string;
    shift: ClassroomShift;
  };
  author: {
    id: string;
    name: string;
    role: UserRole;
  };
}
