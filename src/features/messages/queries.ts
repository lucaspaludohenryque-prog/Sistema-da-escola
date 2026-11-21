import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { prisma } from "@/lib/prisma";
import type {
  MessageThreadSummary,
  ThreadDetailPayload,
  ThreadStudentOption,
} from "./types";

function buildThreadScopeWhere(user: PublicUser): Record<string, unknown> | null {
  if (user.role === "ALUNO") {
    return null;
  }
  if (user.role === "RESPONSAVEL") {
    return { guardianId: user.id };
  }
  if (canManageClassrooms(user.role)) {
    return {};
  }
  // PROFESSOR: conversas das suas turmas ou onde e staffId
  return {
    OR: [
      { staffId: user.id },
      { student: { classroom: { teacherId: user.id } } },
    ],
  };
}

export async function listThreadsForUser(
  user: PublicUser
): Promise<MessageThreadSummary[]> {
  const where = buildThreadScopeWhere(user);
  if (where === null) {
    return [];
  }

  const threads = await prisma.messageThread.findMany({
    where,
    select: {
      id: true,
      subject: true,
      status: true,
      studentId: true,
      guardianId: true,
      staffId: true,
      updatedAt: true,
      student: {
        select: {
          name: true,
          classroom: { select: { name: true, subject: true } },
        },
      },
      guardian: { select: { name: true } },
      staff: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        select: {
          content: true,
          senderId: true,
          readAt: true,
          createdAt: true,
          sender: { select: { name: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return threads.map((t) => {
    const latest = t.messages[0] ?? null;
    const unreadCount = t.messages.filter(
      (m) => m.senderId !== user.id && m.readAt === null
    ).length;

    return {
      id: t.id,
      subject: t.subject,
      status: t.status,
      studentId: t.studentId,
      studentName: t.student.name,
      classroomName: t.student.classroom.name,
      classroomSubject: t.student.classroom.subject,
      guardianId: t.guardianId,
      guardianName: t.guardian.name,
      staffId: t.staffId,
      staffName: t.staff?.name ?? null,
      lastMessage: latest
        ? {
            content: latest.content,
            senderName: latest.sender.name,
            createdAt: latest.createdAt.toISOString(),
          }
        : null,
      unreadCount,
      updatedAt: t.updatedAt.toISOString(),
    };
  });
}

export async function countUnreadThreadsForUser(
  user: PublicUser
): Promise<number> {
  const where = buildThreadScopeWhere(user);
  if (where === null) {
    return 0;
  }

  try {
    return await prisma.messageThread.count({
      where: {
        ...where,
        messages: {
          some: {
            senderId: { not: user.id },
            readAt: null,
          },
        },
      },
    });
  } catch {
    return 0;
  }
}

export async function canUserAccessThread(
  threadId: string,
  user: PublicUser
): Promise<
  | {
      allowed: true;
      thread: {
        id: string;
        subject: string;
        status: "ABERTO" | "ENCERRADO";
        studentId: string;
        guardianId: string;
        staffId: string | null;
        student: {
          name: string;
          classroom: { name: string; subject: string; teacherId: string };
        };
        guardian: { name: string };
        staff: { name: string } | null;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  | { allowed: false; reason: "not_found" | "forbidden" }
> {
  if (user.role === "ALUNO") {
    return { allowed: false, reason: "forbidden" };
  }

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      subject: true,
      status: true,
      studentId: true,
      guardianId: true,
      staffId: true,
      createdAt: true,
      updatedAt: true,
      student: {
        select: {
          name: true,
          classroom: { select: { name: true, subject: true, teacherId: true } },
        },
      },
      guardian: { select: { name: true } },
      staff: { select: { name: true } },
    },
  });

  if (!thread) {
    return { allowed: false, reason: "not_found" };
  }

  if (user.role === "RESPONSAVEL") {
    if (thread.guardianId !== user.id) {
      return { allowed: false, reason: "forbidden" };
    }
    return { allowed: true, thread };
  }

  if (
    canManageClassrooms(user.role) ||
    thread.staffId === user.id ||
    thread.student.classroom.teacherId === user.id
  ) {
    return { allowed: true, thread };
  }

  return { allowed: false, reason: "forbidden" };
}

export async function getThreadDetailAndMarkRead(
  threadId: string,
  user: PublicUser
): Promise<
  | { status: "ok"; data: ThreadDetailPayload }
  | { status: "not_found" }
  | { status: "forbidden" }
> {
  const access = await canUserAccessThread(threadId, user);
  if (!access.allowed) {
    return { status: access.reason };
  }

  const now = new Date();
  await prisma.directMessage.updateMany({
    where: {
      threadId,
      senderId: { not: user.id },
      readAt: null,
    },
    data: { readAt: now },
  });

  const messages = await prisma.directMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      threadId: true,
      senderId: true,
      content: true,
      readAt: true,
      createdAt: true,
      sender: { select: { name: true, role: true } },
    },
  });

  const t = access.thread;

  return {
    status: "ok",
    data: {
      thread: {
        id: t.id,
        subject: t.subject,
        status: t.status,
        studentId: t.studentId,
        studentName: t.student.name,
        classroomName: t.student.classroom.name,
        classroomSubject: t.student.classroom.subject,
        guardianId: t.guardianId,
        guardianName: t.guardian.name,
        staffId: t.staffId,
        staffName: t.staff?.name ?? null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      },
      messages: messages.map((m) => ({
        id: m.id,
        threadId: m.threadId,
        senderId: m.senderId,
        senderName: m.sender.name,
        senderRole: m.sender.role,
        content: m.content,
        readAt: m.readAt ? m.readAt.toISOString() : null,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  };
}

export async function listStudentsForNewThread(
  user: PublicUser
): Promise<ThreadStudentOption[]> {
  if (user.role === "RESPONSAVEL") {
    const links = await prisma.guardianStudent.findMany({
      where: { guardianId: user.id, student: { active: true } },
      select: {
        relationship: true,
        student: {
          select: {
            id: true,
            name: true,
            classroom: { select: { name: true, subject: true } },
          },
        },
      },
      orderBy: { student: { name: "asc" } },
    });

    return links.map((l) => ({
      studentId: l.student.id,
      studentName: l.student.name,
      classroomName: l.student.classroom.name,
      classroomSubject: l.student.classroom.subject,
      guardians: [
        { id: user.id, name: user.name, relationship: l.relationship },
      ],
    }));
  }

  if (user.role === "ALUNO") {
    return [];
  }

  const students = await prisma.student.findMany({
    where: {
      active: true,
      guardianLinks: { some: {} },
      ...(canManageClassrooms(user.role)
        ? {}
        : { classroom: { teacherId: user.id } }),
    },
    select: {
      id: true,
      name: true,
      classroom: { select: { name: true, subject: true } },
      guardianLinks: {
        select: {
          relationship: true,
          guardian: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return students.map((st) => ({
    studentId: st.id,
    studentName: st.name,
    classroomName: st.classroom.name,
    classroomSubject: st.classroom.subject,
    guardians: st.guardianLinks.map((g) => ({
      id: g.guardian.id,
      name: g.guardian.name,
      relationship: g.relationship,
    })),
  }));
}
