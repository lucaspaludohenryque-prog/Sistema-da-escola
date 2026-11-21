import type { ClassroomShift } from "@/features/classrooms/types";

export const SCHEDULE_DAYS = [1, 2, 3, 4, 5] as const;
export type ScheduleDayOfWeek = (typeof SCHEDULE_DAYS)[number];

export const SCHEDULE_DAY_LABELS: Record<ScheduleDayOfWeek, string> = {
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
};

export const SCHEDULE_DAY_SHORT_LABELS: Record<ScheduleDayOfWeek, string> = {
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
};

export const DEFAULT_LESSON_TIMES: Record<
  number,
  { startTime: string; endTime: string }
> = {
  1: { startTime: "07:30", endTime: "08:20" },
  2: { startTime: "08:20", endTime: "09:10" },
  3: { startTime: "09:30", endTime: "10:20" },
  4: { startTime: "10:20", endTime: "11:10" },
  5: { startTime: "11:10", endTime: "12:00" },
  6: { startTime: "12:00", endTime: "12:50" },
};

export interface ScheduleSlotItem {
  id: string;
  classroomId: string;
  dayOfWeek: ScheduleDayOfWeek;
  lessonNumber: number;
  startTime: string;
  endTime: string;
  room: string | null;
  classroom: {
    id: string;
    name: string;
    subject: string;
    shift: ClassroomShift;
    teacherName: string;
  };
  canEdit: boolean;
}
