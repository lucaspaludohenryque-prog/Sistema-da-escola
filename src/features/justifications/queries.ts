import { JustificationStatus } from "@prisma/client";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { prisma } from "@/lib/prisma";
import type { AbsenceJustificationItem } from "./types";

export async function countPendingJustifications(): Promise<number> {
  try {
    return await prisma.absenceJustification.count({
      where: { status: JustificationStatus.PENDENTE },
    });
  } catch {
    return 0;
  }
}

export async function listJustificationsForUser(
  user: PublicUser,
  statusFilter?: JustificationStatus
): Promise<{
  justifications: AbsenceJustificationItem[];
  pendingCount: number;
}> {
  const isManager = canManageClassrooms(user.role);

  const whereClause = {
    ...(isManager ? {} : { guardianId: user.id }),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [rows, pendingCount] = await Promise.all([
    prisma.absenceJustification.findMany({
      where: whereClause,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        attendanceId: true,
        studentId: true,
        reason: true,
        status: true,
        reviewNote: true,
        reviewedAt: true,
        createdAt: true,
        student: {
          select: {
            name: true,
            registration: true,
            classroom: { select: { name: true, subject: true } },
          },
        },
        attendance: {
          select: {
            lesson: { select: { date: true, lessonNumber: true } },
          },
        },
        guardian: {
          select: { name: true, email: true },
        },
      },
    }),
    isManager ? countPendingJustifications() : Promise.resolve(0),
  ]);

  const justifications: AbsenceJustificationItem[] = rows.map((row) => ({
    id: row.id,
    attendanceId: row.attendanceId,
    studentId: row.studentId,
    studentName: row.student.name,
    studentRegistration: row.student.registration,
    classroomName: row.student.classroom.name,
    classroomSubject: row.student.classroom.subject,
    lessonDate: row.attendance.lesson.date,
    lessonNumber: row.attendance.lesson.lessonNumber,
    guardianName: row.guardian.name,
    guardianEmail: row.guardian.email,
    reason: row.reason,
    status: row.status,
    reviewNote: row.reviewNote,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }));

  return { justifications, pendingCount };
}
