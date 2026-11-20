import type { UserRole } from "@/features/auth/types";
import type { ClassroomShift } from "./types";

export const SHIFT_LABELS: Record<ClassroomShift, string> = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  NOITE: "Noite",
};

export const SHIFT_BADGE_STYLES: Record<ClassroomShift, string> = {
  MANHA: "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200",
  TARDE: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  NOITE: "bg-slate-900 text-slate-100",
};

export const CLASSROOM_MANAGER_ROLES: readonly UserRole[] = [
  "ADMIN",
  "COORDENACAO",
];

export function canManageClassrooms(role: UserRole): boolean {
  return CLASSROOM_MANAGER_ROLES.includes(role);
}
