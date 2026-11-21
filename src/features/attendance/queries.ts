import { AttendanceStatus } from "@prisma/client";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { prisma } from "@/lib/prisma";
import type {
  AttendanceSheetData,
  AttendanceStudentRow,
  LessonHistoryItem,
} from "./types";

const ptBrCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

export type AttendanceSheetResult =
  | { status: "ok"; data: AttendanceSheetData }
  | { status: "not_found" }
  | { status: "forbidden" };

export type LessonHistoryResult =
  | { status: "ok"; lessons: LessonHistoryItem[] }
  | { status: "not_found" }
  | { status: "forbidden" };

/**
 * Carrega a pauta de chamada de uma aula (existente ou nova), a lista de alunos ativos
 * em ordem alfabetica (pt-BR) e a porcentagem consolidada de frequencia na turma.
 */
export async function getAttendanceSheetForUser(params: {
  classroomId: string;
  date: string;
  lessonNumber: number;
  user: PublicUser;
}): Promise<AttendanceSheetResult> {
  const { classroomId, date, lessonNumber, user } = params;

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: {
      id: true,
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
  });

  if (!classroom) {
    return { status: "not_found" };
  }

  if (!canManageClassrooms(user.role) && classroom.teacherId !== user.id) {
    return { status: "forbidden" };
  }

  const [existingLesson, groupedStats] = await Promise.all([
    prisma.lesson.findUnique({
      where: {
        classroomId_date_lessonNumber: {
          classroomId,
          date,
          lessonNumber,
        },
      },
      select: {
        id: true,
        classroomId: true,
        date: true,
        lessonNumber: true,
        content: true,
        observations: true,
        createdAt: true,
        updatedAt: true,
        attendances: {
          select: {
            studentId: true,
            status: true,
          },
        },
      },
    }),
    prisma.attendance.groupBy({
      by: ["studentId", "status"],
      where: {
        lesson: { classroomId },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const savedStatusByStudent = new Map<string, AttendanceStatus>();
  if (existingLesson) {
    for (const record of existingLesson.attendances) {
      savedStatusByStudent.set(record.studentId, record.status);
    }
  }

  const statsByStudent = new Map<
    string,
    { present: number; absent: number; justified: number }
  >();

  for (const row of groupedStats) {
    const current = statsByStudent.get(row.studentId) ?? {
      present: 0,
      absent: 0,
      justified: 0,
    };
    if (row.status === AttendanceStatus.PRESENTE) {
      current.present += row._count._all;
    } else if (row.status === AttendanceStatus.FALTA) {
      current.absent += row._count._all;
    } else if (row.status === AttendanceStatus.JUSTIFICADA) {
      current.justified += row._count._all;
    }
    statsByStudent.set(row.studentId, current);
  }

  const sortedStudents = [...classroom.students].sort((a, b) =>
    ptBrCollator.compare(a.name, b.name)
  );

  const studentRows: AttendanceStudentRow[] = sortedStudents.map((student) => {
    const stats = statsByStudent.get(student.id) ?? {
      present: 0,
      absent: 0,
      justified: 0,
    };
    const totalRecordedLessons = stats.present + stats.absent + stats.justified;
    const attendanceRate =
      totalRecordedLessons > 0
        ? Math.round(((stats.present + stats.justified) / totalRecordedLessons) * 100)
        : null;

    return {
      studentId: student.id,
      name: student.name,
      registration: student.registration,
      status: savedStatusByStudent.get(student.id) ?? AttendanceStatus.PRESENTE,
      attendanceRate,
      totalRecordedLessons,
      presentCount: stats.present,
      absentCount: stats.absent,
      justifiedCount: stats.justified,
    };
  });

  return {
    status: "ok",
    data: {
      classroomId: classroom.id,
      classroomName: classroom.name,
      classroomSubject: classroom.subject,
      date,
      lessonNumber,
      lesson: existingLesson
        ? {
            id: existingLesson.id,
            classroomId: existingLesson.classroomId,
            date: existingLesson.date,
            lessonNumber: existingLesson.lessonNumber,
            content: existingLesson.content,
            observations: existingLesson.observations,
            createdAt: existingLesson.createdAt.toISOString(),
            updatedAt: existingLesson.updatedAt.toISOString(),
          }
        : null,
      students: studentRows,
    },
  };
}

/**
 * Retorna o historico de aulas registradas de uma turma da mais recente para a mais antiga,
 * com totais de presenca, falta e falta justificada por aula.
 */
export async function listLessonsForClassroom(
  classroomId: string,
  user: PublicUser
): Promise<LessonHistoryResult> {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { id: true, teacherId: true },
  });

  if (!classroom) {
    return { status: "not_found" };
  }

  if (!canManageClassrooms(user.role) && classroom.teacherId !== user.id) {
    return { status: "forbidden" };
  }

  const lessons = await prisma.lesson.findMany({
    where: { classroomId },
    select: {
      id: true,
      classroomId: true,
      date: true,
      lessonNumber: true,
      content: true,
      observations: true,
      updatedAt: true,
      attendances: {
        select: {
          status: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { lessonNumber: "desc" }],
  });

  const formatted: LessonHistoryItem[] = lessons.map((lesson) => {
    let presentCount = 0;
    let absentCount = 0;
    let justifiedCount = 0;

    for (const att of lesson.attendances) {
      if (att.status === AttendanceStatus.PRESENTE) {
        presentCount += 1;
      } else if (att.status === AttendanceStatus.FALTA) {
        absentCount += 1;
      } else if (att.status === AttendanceStatus.JUSTIFICADA) {
        justifiedCount += 1;
      }
    }

    return {
      id: lesson.id,
      classroomId: lesson.classroomId,
      date: lesson.date,
      lessonNumber: lesson.lessonNumber,
      content: lesson.content,
      observations: lesson.observations,
      presentCount,
      absentCount,
      justifiedCount,
      totalCount: lesson.attendances.length,
      updatedAt: lesson.updatedAt.toISOString(),
    };
  });

  return { status: "ok", lessons: formatted };
}
