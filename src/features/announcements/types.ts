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
      "border border-zinc-200/80 bg-zinc-50 text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-300",
    IMPORTANTE:
      "border border-amber-200/80 bg-amber-50/70 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    URGENTE:
      "border border-red-200/80 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
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
