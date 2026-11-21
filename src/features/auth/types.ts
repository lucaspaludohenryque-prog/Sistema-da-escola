export const USER_ROLES = [
  "ADMIN",
  "COORDENACAO",
  "PROFESSOR",
  "RESPONSAVEL",
  "ALUNO",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface SessionPayload {
  sub: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUserResponse {
  user: PublicUser;
}

export interface AuthErrorResponse {
  error: string;
  code:
    | "VALIDATION_ERROR"
    | "INVALID_CREDENTIALS"
    | "ACCOUNT_DISABLED"
    | "UNAUTHORIZED"
    | "INTERNAL_ERROR";
}

export function isStaffRole(role: UserRole): boolean {
  return role === "ADMIN" || role === "COORDENACAO" || role === "PROFESSOR";
}

export function getDefaultDashboardPath(role: UserRole): string {
  if (role === "RESPONSAVEL") {
    return "/dashboard/familia";
  }
  if (role === "ALUNO") {
    return "/dashboard/aluno";
  }
  return "/dashboard";
}
