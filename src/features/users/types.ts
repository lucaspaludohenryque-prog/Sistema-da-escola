import type { UserRole } from "@/features/auth/types";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  classroomCount: number;
  occurrenceCount: number;
  createdAt: string;
}
