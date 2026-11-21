export const HOMEWORK_TYPES = [
  "TAREFA",
  "TRABALHO",
  "MATERIAL",
  "LEITURA",
] as const;

export type HomeworkType = (typeof HOMEWORK_TYPES)[number];

export const HOMEWORK_SUBMISSION_STATUSES = [
  "PENDENTE",
  "ENTREGUE",
  "ATRASADO",
  "CONFERIDO",
] as const;

export type HomeworkSubmissionStatus =
  (typeof HOMEWORK_SUBMISSION_STATUSES)[number];

export const HOMEWORK_TYPE_LABELS: Record<HomeworkType, string> = {
  TAREFA: "Tarefa",
  TRABALHO: "Trabalho",
  MATERIAL: "Material",
  LEITURA: "Leitura",
};

export const HOMEWORK_TYPE_STYLES: Record<HomeworkType, string> = {
  TAREFA:
    "border border-blue-200/80 bg-blue-50/70 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  TRABALHO:
    "border border-indigo-200/80 bg-indigo-50/70 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300",
  MATERIAL:
    "border border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  LEITURA:
    "border border-amber-200/80 bg-amber-50/70 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
};

export const SUBMISSION_STATUS_LABELS: Record<HomeworkSubmissionStatus, string> = {
  PENDENTE: "Pendente",
  ENTREGUE: "Entregue",
  ATRASADO: "Atrasado",
  CONFERIDO: "Conferido",
};

export const SUBMISSION_STATUS_STYLES: Record<HomeworkSubmissionStatus, string> = {
  PENDENTE:
    "border border-zinc-200/80 bg-zinc-50 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300",
  ENTREGUE:
    "border border-blue-200/80 bg-blue-50/70 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  ATRASADO:
    "border border-red-200/80 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  CONFERIDO:
    "border border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
};

export interface HomeworkStudentSubmissionSummary {
  studentId: string;
  studentName: string;
  status: HomeworkSubmissionStatus;
  studentNote: string | null;
  teacherFeedback: string | null;
  submittedAt: string | null;
}

export interface HomeworkItem {
  id: string;
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  dueDate: string;
  resourceUrl: string | null;
  type: HomeworkType;
  createdAt: string;
  canManage: boolean;
  totalStudents: number;
  submittedCount: number;
  studentSubmissions: HomeworkStudentSubmissionSummary[];
}

export interface HomeworkSubmissionDetail {
  studentId: string;
  studentName: string;
  studentRegistration: string;
  status: HomeworkSubmissionStatus;
  studentNote: string | null;
  teacherFeedback: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
}
