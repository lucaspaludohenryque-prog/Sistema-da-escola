export const ANNOUNCEMENT_PRIORITIES = [
  "NORMAL",
  "IMPORTANTE",
  "URGENTE",
] as const;

export type AnnouncementPriority = (typeof ANNOUNCEMENT_PRIORITIES)[number];

export const ANNOUNCEMENT_PRIORITY_LABELS: Record<AnnouncementPriority, string> =
  {
    NORMAL: "Normal",
    IMPORTANTE: "Importante",
    URGENTE: "Urgente",
  };

export const ANNOUNCEMENT_PRIORITY_STYLES: Record<AnnouncementPriority, string> =
  {
    NORMAL:
      "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30",
    IMPORTANTE:
      "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
    URGENTE:
      "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30",
  };

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  pinned: boolean;
  classroomId: string | null;
  classroomLabel: string | null;
  authorId: string;
  authorName: string;
  canManage: boolean;
  createdAt: string;
}
