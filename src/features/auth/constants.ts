import type { UserRole } from "./types";

export const SESSION_COOKIE_NAME = "rco_session";

/** Duracao maxima da sessao autenticada: 8 horas (padrao institucional). */
export const SESSION_DURATION_SECONDS = 60 * 60 * 8;

export const BCRYPT_COST = 12;

/**
 * Hash bcrypt valido usado para equalizar o tempo de resposta quando o e-mail
 * informado nao existe, mitigando enumeracao de contas por timing attack.
 */
export const DUMMY_PASSWORD_HASH =
  "$2b$12$C6UzMDM.H6dfI/f/IKcEeO9N2j8y9pW1xX7f4vQ3gK5n8zL2mR6yW";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  COORDENACAO: "Coordenação",
  PROFESSOR: "Professor",
  RESPONSAVEL: "Responsável",
  ALUNO: "Aluno",
};

export const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  ADMIN:
    "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
  COORDENACAO:
    "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30",
  PROFESSOR:
    "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
  RESPONSAVEL:
    "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
  ALUNO:
    "bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/30",
};
