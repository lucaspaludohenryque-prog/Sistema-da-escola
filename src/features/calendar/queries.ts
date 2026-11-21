import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { getAllowedClassroomIdsForUser } from "@/features/schedule/queries";
import { prisma } from "@/lib/prisma";
import type { SchoolEventItem } from "./types";

const MONTH_REGEX = /^\d{4}-\d{2}$/;

export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function listSchoolEventsForUser(
  user: PublicUser,
  month?: string | null
): Promise<SchoolEventItem[]> {
  const allowed = await getAllowedClassroomIdsForUser(user);
  const validMonth = month && MONTH_REGEX.test(month) ? month : null;

  const scopeFilter =
    allowed === "ALL"
      ? {}
      : allowed.length === 0
        ? { classroomId: null }
        : {
            OR: [{ classroomId: null }, { classroomId: { in: allowed } }],
          };

  const rows = await prisma.schoolEvent.findMany({
    where: {
      ...scopeFilter,
      ...(validMonth ? { date: { startsWith: `${validMonth}-` } } : {}),
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      type: true,
      classroomId: true,
      authorId: true,
      createdAt: true,
      classroom: {
        select: { name: true, subject: true },
      },
      author: {
        select: { name: true },
      },
    },
  });

  const isManager = canManageClassrooms(user.role);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    type: row.type,
    classroomId: row.classroomId,
    classroomLabel: row.classroom
      ? `${row.classroom.name} - ${row.classroom.subject}`
      : null,
    authorId: row.authorId,
    authorName: row.author.name,
    canDelete: isManager || row.authorId === user.id,
    createdAt: row.createdAt.toISOString(),
  }));
}
