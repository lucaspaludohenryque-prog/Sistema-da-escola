import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { prisma } from "@/lib/prisma";
import type { MeetingItem } from "./types";

export async function listMeetingsForUser(
  user: PublicUser
): Promise<MeetingItem[]> {
  if (user.role === "ALUNO") {
    return [];
  }

  const where =
    user.role === "RESPONSAVEL"
      ? { guardianId: user.id }
      : canManageClassrooms(user.role)
        ? {}
        : {
            OR: [
              { organizerId: user.id },
              { student: { classroom: { teacherId: user.id } } },
            ],
          };

  const records = await prisma.meeting.findMany({
    where,
    select: {
      id: true,
      title: true,
      studentId: true,
      guardianId: true,
      organizerId: true,
      date: true,
      time: true,
      mode: true,
      locationOrLink: true,
      notes: true,
      status: true,
      guardianNote: true,
      createdAt: true,
      student: {
        select: {
          name: true,
          classroom: { select: { name: true, subject: true } },
        },
      },
      guardian: { select: { name: true } },
      organizer: { select: { name: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return records.map((m) => ({
    id: m.id,
    title: m.title,
    studentId: m.studentId,
    studentName: m.student.name,
    classroomName: m.student.classroom.name,
    classroomSubject: m.student.classroom.subject,
    guardianId: m.guardianId,
    guardianName: m.guardian.name,
    organizerId: m.organizerId,
    organizerName: m.organizer.name,
    date: m.date,
    time: m.time,
    mode: m.mode,
    locationOrLink: m.locationOrLink,
    notes: m.notes,
    status: m.status,
    guardianNote: m.guardianNote,
    createdAt: m.createdAt.toISOString(),
  }));
}
