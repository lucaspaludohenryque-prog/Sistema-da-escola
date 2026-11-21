import { HomeworkSubmissionStatus } from "@prisma/client";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { prisma } from "@/lib/prisma";
import type {
  HomeworkItem,
  HomeworkStudentSubmissionSummary,
  HomeworkSubmissionDetail,
} from "./types";

const ptBrCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

export async function listHomeworksForUser(
  user: PublicUser,
  classroomIdFilter?: string
): Promise<HomeworkItem[]> {
  let allowedClassroomIds: string[] | null = null;
  const targetStudentsByClassroom = new Map<
    string,
    Array<{ id: string; name: string }>
  >();

  if (user.role === "ALUNO") {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true, name: true, classroomId: true },
    });
    if (!student) {
      return [];
    }
    allowedClassroomIds = [student.classroomId];
    targetStudentsByClassroom.set(student.classroomId, [
      { id: student.id, name: student.name },
    ]);
  } else if (user.role === "RESPONSAVEL") {
    const links = await prisma.guardianStudent.findMany({
      where: {
        guardianId: user.id,
        student: { active: true },
      },
      select: {
        student: {
          select: { id: true, name: true, classroomId: true },
        },
      },
    });
    if (links.length === 0) {
      return [];
    }
    const classroomSet = new Set<string>();
    for (const link of links) {
      classroomSet.add(link.student.classroomId);
      const list = targetStudentsByClassroom.get(link.student.classroomId) ?? [];
      list.push({ id: link.student.id, name: link.student.name });
      targetStudentsByClassroom.set(link.student.classroomId, list);
    }
    allowedClassroomIds = Array.from(classroomSet);
  } else if (user.role === "PROFESSOR") {
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: user.id },
      select: { id: true },
    });
    allowedClassroomIds = classrooms.map((c) => c.id);
    if (allowedClassroomIds.length === 0) {
      return [];
    }
  }

  let whereClassroom: { classroomId?: string | { in: string[] } } = {};
  if (allowedClassroomIds !== null) {
    if (classroomIdFilter) {
      if (!allowedClassroomIds.includes(classroomIdFilter)) {
        return [];
      }
      whereClassroom = { classroomId: classroomIdFilter };
    } else {
      whereClassroom = { classroomId: { in: allowedClassroomIds } };
    }
  } else if (classroomIdFilter) {
    whereClassroom = { classroomId: classroomIdFilter };
  }

  const homeworks = await prisma.homework.findMany({
    where: whereClassroom,
    select: {
      id: true,
      classroomId: true,
      authorId: true,
      title: true,
      description: true,
      dueDate: true,
      resourceUrl: true,
      type: true,
      createdAt: true,
      author: { select: { name: true } },
      classroom: {
        select: {
          name: true,
          subject: true,
          teacherId: true,
          _count: { select: { students: { where: { active: true } } } },
        },
      },
      submissions: {
        select: {
          studentId: true,
          status: true,
          studentNote: true,
          teacherFeedback: true,
          submittedAt: true,
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const isManager = canManageClassrooms(user.role);

  return homeworks.map((hw) => {
    const submittedCount = hw.submissions.filter(
      (s) =>
        s.status === HomeworkSubmissionStatus.ENTREGUE ||
        s.status === HomeworkSubmissionStatus.CONFERIDO
    ).length;

    const submissionByStudent = new Map(
      hw.submissions.map((s) => [s.studentId, s])
    );

    const targetStudents = targetStudentsByClassroom.get(hw.classroomId) ?? [];
    const studentSubmissions: HomeworkStudentSubmissionSummary[] =
      targetStudents.map((st) => {
        const sub = submissionByStudent.get(st.id);
        return {
          studentId: st.id,
          studentName: st.name,
          status: sub?.status ?? "PENDENTE",
          studentNote: sub?.studentNote ?? null,
          teacherFeedback: sub?.teacherFeedback ?? null,
          submittedAt: sub?.submittedAt ? sub.submittedAt.toISOString() : null,
        };
      });

    return {
      id: hw.id,
      classroomId: hw.classroomId,
      classroomName: hw.classroom.name,
      classroomSubject: hw.classroom.subject,
      authorId: hw.authorId,
      authorName: hw.author.name,
      title: hw.title,
      description: hw.description,
      dueDate: hw.dueDate,
      resourceUrl: hw.resourceUrl,
      type: hw.type,
      createdAt: hw.createdAt.toISOString(),
      canManage: isManager || hw.classroom.teacherId === user.id,
      totalStudents: hw.classroom._count.students,
      submittedCount,
      studentSubmissions,
    };
  });
}

export type HomeworkSubmissionsResult =
  | {
      status: "ok";
      homework: {
        id: string;
        title: string;
        dueDate: string;
        classroomName: string;
        classroomSubject: string;
      };
      submissions: HomeworkSubmissionDetail[];
    }
  | { status: "not_found" }
  | { status: "forbidden" };

export async function getHomeworkSubmissionsForStaff(
  homeworkId: string,
  user: PublicUser
): Promise<HomeworkSubmissionsResult> {
  const hw = await prisma.homework.findUnique({
    where: { id: homeworkId },
    select: {
      id: true,
      title: true,
      dueDate: true,
      classroom: {
        select: {
          name: true,
          subject: true,
          teacherId: true,
          students: {
            where: { active: true },
            select: {
              id: true,
              name: true,
              registration: true,
            },
            orderBy: { name: "asc" },
          },
        },
      },
      submissions: {
        select: {
          studentId: true,
          status: true,
          studentNote: true,
          teacherFeedback: true,
          submittedAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!hw) {
    return { status: "not_found" };
  }

  if (!canManageClassrooms(user.role) && hw.classroom.teacherId !== user.id) {
    return { status: "forbidden" };
  }

  const subMap = new Map(hw.submissions.map((s) => [s.studentId, s]));
  const sortedStudents = [...hw.classroom.students].sort((a, b) =>
    ptBrCollator.compare(a.name, b.name)
  );

  const submissions: HomeworkSubmissionDetail[] = sortedStudents.map((st) => {
    const sub = subMap.get(st.id);
    return {
      studentId: st.id,
      studentName: st.name,
      studentRegistration: st.registration,
      status: sub?.status ?? "PENDENTE",
      studentNote: sub?.studentNote ?? null,
      teacherFeedback: sub?.teacherFeedback ?? null,
      submittedAt: sub?.submittedAt ? sub.submittedAt.toISOString() : null,
      updatedAt: sub?.updatedAt ? sub.updatedAt.toISOString() : null,
    };
  });

  return {
    status: "ok",
    homework: {
      id: hw.id,
      title: hw.title,
      dueDate: hw.dueDate,
      classroomName: hw.classroom.name,
      classroomSubject: hw.classroom.subject,
    },
    submissions,
  };
}
