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
    "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30",
  TRABALHO:
    "bg-purple-50 text-purple-800 ring-1 ring-inset ring-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:ring-purple-400/30",
  MATERIAL:
    "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
  LEITURA:
    "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
};

export const SUBMISSION_STATUS_LABELS: Record<HomeworkSubmissionStatus, string> = {
  PENDENTE: "Pendente",
  ENTREGUE: "Entregue",
  ATRASADO: "Atrasado",
  CONFERIDO: "Conferido",
};

export const SUBMISSION_STATUS_STYLES: Record<HomeworkSubmissionStatus, string> = {
  PENDENTE:
    "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  ENTREGUE:
    "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30",
  ATRASADO:
    "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30",
  CONFERIDO:
    "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
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
