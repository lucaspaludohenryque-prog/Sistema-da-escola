import { AttendanceStatus } from "@prisma/client";
import { LOW_ATTENDANCE_THRESHOLD } from "@/features/attendance/constants";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import {
  calculateFinalTermAverage,
  calculateWeightedTermAverage,
} from "@/features/grades/calculations";
import { PASSING_GRADE_THRESHOLD } from "@/features/grades/constants";
import type { AcademicTerm } from "@/features/grades/types";
import { getSchoolConfig } from "@/features/school-config";
import { prisma } from "@/lib/prisma";
import type { ClassCouncilPayload, CouncilAlertStudent } from "./types";

export type ClassCouncilResult =
  | { status: "ok"; data: ClassCouncilPayload }
  | { status: "not_found" }
  | { status: "forbidden" };

export async function getClassCouncilForUser(params: {
  classroomId: string;
  term: AcademicTerm;
  user: PublicUser;
}): Promise<ClassCouncilResult> {
  const { classroomId, term, user } = params;

  const [school, classroom] = await Promise.all([
    getSchoolConfig(),
    prisma.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        name: true,
        subject: true,
        year: true,
        shift: true,
        teacherId: true,
        teacher: { select: { name: true } },
        students: {
          where: { active: true },
          select: { id: true, name: true, registration: true },
          orderBy: { name: "asc" },
        },
        assessments: {
          where: { term },
          select: {
            id: true,
            maxScore: true,
            weight: true,
            grades: { select: { studentId: true, score: true } },
          },
        },
        termRecoveries: {
          where: { term },
          select: { studentId: true, score: true },
        },
        councilMinutes: {
          where: { term },
          select: {
            id: true,
            classroomId: true,
            term: true,
            date: true,
            summary: true,
            decisions: true,
            updatedAt: true,
            author: { select: { name: true } },
          },
        },
        _count: {
          select: {
            occurrences: true,
            lessons: true,
          },
        },
      },
    }),
  ]);

  if (!classroom) {
    return { status: "not_found" };
  }

  if (!canManageClassrooms(user.role) && classroom.teacherId !== user.id) {
    return { status: "forbidden" };
  }

  const activeIds = classroom.students.map((s) => s.id);
  const attendanceGroups =
    activeIds.length > 0
      ? await prisma.attendance.groupBy({
          by: ["studentId", "status"],
          where: {
            studentId: { in: activeIds },
            lesson: { classroomId: classroom.id },
          },
          _count: { _all: true },
        })
      : [];

  const attMap = new Map<
    string,
    { present: number; absent: number; justified: number }
  >();
  for (const g of attendanceGroups) {
    const cur = attMap.get(g.studentId) ?? {
      present: 0,
      absent: 0,
      justified: 0,
    };
    if (g.status === AttendanceStatus.PRESENTE) cur.present += g._count._all;
    else if (g.status === AttendanceStatus.FALTA) cur.absent += g._count._all;
    else if (g.status === AttendanceStatus.JUSTIFICADA)
      cur.justified += g._count._all;
    attMap.set(g.studentId, cur);
  }

  const gradeMap = new Map<string, number>();
  for (const a of classroom.assessments) {
    for (const g of a.grades) {
      gradeMap.set(`${a.id}:${g.studentId}`, g.score);
    }
  }

  const recoveryMap = new Map<string, number>();
  for (const rec of classroom.termRecoveries) {
    recoveryMap.set(rec.studentId, rec.score);
  }

  let belowAverageCount = 0;
  let lowAttendanceCount = 0;
  const attentionStudents: CouncilAlertStudent[] = [];

  for (const student of classroom.students) {
    const weighted = classroom.assessments.map((a) => ({
      score: gradeMap.get(`${a.id}:${student.id}`) ?? null,
      maxScore: a.maxScore,
      weight: a.weight,
    }));
    const rawAvg = calculateWeightedTermAverage(weighted);
    const rec = recoveryMap.get(student.id) ?? null;
    const finalAvg = calculateFinalTermAverage(rawAvg, rec);

    const att = attMap.get(student.id);
    const totalAtt = att ? att.present + att.absent + att.justified : 0;
    const rate =
      att && totalAtt > 0
        ? Math.round(((att.present + att.justified) / totalAtt) * 100)
        : null;

    const isLowAvg = finalAvg !== null && finalAvg < PASSING_GRADE_THRESHOLD;
    const isLowAtt = rate !== null && rate < LOW_ATTENDANCE_THRESHOLD;

    if (isLowAvg) belowAverageCount += 1;
    if (isLowAtt) lowAttendanceCount += 1;

    if (isLowAvg || isLowAtt) {
      attentionStudents.push({
        studentId: student.id,
        name: student.name,
        registration: student.registration,
        termFinalAverage: finalAvg,
        attendanceRate: rate,
      });
    }
  }

  const savedMinute = classroom.councilMinutes[0];

  return {
    status: "ok",
    data: {
      school,
      classroom: {
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        year: classroom.year,
        shift: classroom.shift,
        teacherName: classroom.teacher.name,
      },
      term,
      metrics: {
        totalStudents: classroom.students.length,
        belowAverageCount,
        lowAttendanceCount,
        occurrencesCount: classroom._count.occurrences,
        lessonsCount: classroom._count.lessons,
      },
      attentionStudents,
      minute: savedMinute
        ? {
            id: savedMinute.id,
            classroomId: savedMinute.classroomId,
            term: savedMinute.term as AcademicTerm,
            date: savedMinute.date,
            summary: savedMinute.summary,
            decisions: savedMinute.decisions,
            authorName: savedMinute.author.name,
            updatedAt: savedMinute.updatedAt.toISOString(),
          }
        : null,
    },
  };
}
