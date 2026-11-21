import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { getAllowedClassroomIdsForUser } from "@/features/schedule/queries";
import { prisma } from "@/lib/prisma";
import type { AnnouncementItem } from "./types";

export async function listAnnouncementsForUser(
  user: PublicUser
): Promise<AnnouncementItem[]> {
  const allowed = await getAllowedClassroomIdsForUser(user);
  const isManager = canManageClassrooms(user.role);

  const whereClause =
    allowed === "ALL"
      ? {}
      : allowed.length === 0
        ? { classroomId: null }
        : { OR: [{ classroomId: null }, { classroomId: { in: allowed } }] };

  const rows = await prisma.announcement.findMany({
    where: whereClause,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      content: true,
      priority: true,
      pinned: true,
      classroomId: true,
      authorId: true,
      createdAt: true,
      classroom: { select: { name: true, subject: true } },
      author: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    priority: row.priority,
    pinned: row.pinned,
    classroomId: row.classroomId,
    classroomLabel: row.classroom
      ? `${row.classroom.name} - ${row.classroom.subject}`
      : null,
    authorId: row.authorId,
    authorName: row.author.name,
    canManage: isManager || row.authorId === user.id,
    createdAt: row.createdAt.toISOString(),
  }));
}
