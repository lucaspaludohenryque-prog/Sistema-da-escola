import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { prisma } from "@/lib/prisma";
import type { ScheduleDayOfWeek, ScheduleSlotItem } from "./types";

export async function getAllowedClassroomIdsForUser(
  user: PublicUser
): Promise<string[] | "ALL"> {
  if (canManageClassrooms(user.role)) {
    return "ALL";
  }

  if (user.role === "PROFESSOR") {
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: user.id },
      select: { id: true },
    });
    return classrooms.map((c) => c.id);
  }

  if (user.role === "RESPONSAVEL") {
    const links = await prisma.guardianStudent.findMany({
      where: { guardianId: user.id },
      select: { student: { select: { classroomId: true } } },
    });
    return Array.from(new Set(links.map((l) => l.student.classroomId)));
  }

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    select: { classroomId: true },
  });
  return student ? [student.classroomId] : [];
}

export async function listScheduleForUser(
  user: PublicUser,
  classroomIdFilter?: string | null
): Promise<ScheduleSlotItem[]> {
  const allowed = await getAllowedClassroomIdsForUser(user);

  if (allowed !== "ALL" && allowed.length === 0) {
    return [];
  }

  let whereClassroom: { classroomId?: string | { in: string[] } } = {};

  if (classroomIdFilter && classroomIdFilter.trim().length > 0) {
    if (allowed !== "ALL" && !allowed.includes(classroomIdFilter)) {
      return [];
    }
    whereClassroom = { classroomId: classroomIdFilter };
  } else if (allowed !== "ALL") {
    whereClassroom = { classroomId: { in: allowed } };
  }

  const rows = await prisma.scheduleSlot.findMany({
    where: whereClassroom,
    orderBy: [{ dayOfWeek: "asc" }, { lessonNumber: "asc" }],
    select: {
      id: true,
      classroomId: true,
      dayOfWeek: true,
      lessonNumber: true,
      startTime: true,
      endTime: true,
      room: true,
      classroom: {
        select: {
          id: true,
          name: true,
          subject: true,
          shift: true,
          teacherId: true,
          teacher: { select: { name: true } },
        },
      },
    },
  });

  const isManager = canManageClassrooms(user.role);

  return rows.map((row) => ({
    id: row.id,
    classroomId: row.classroomId,
    dayOfWeek: row.dayOfWeek as ScheduleDayOfWeek,
    lessonNumber: row.lessonNumber,
    startTime: row.startTime,
    endTime: row.endTime,
    room: row.room,
    classroom: {
      id: row.classroom.id,
      name: row.classroom.name,
      subject: row.classroom.subject,
      shift: row.classroom.shift,
      teacherName: row.classroom.teacher.name,
    },
    canEdit:
      isManager ||
      (user.role === "PROFESSOR" && row.classroom.teacherId === user.id),
  }));
}
