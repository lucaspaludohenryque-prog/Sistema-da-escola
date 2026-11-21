import { AttendanceStatus, OccurrenceStatus } from "@prisma/client";
import { LOW_ATTENDANCE_THRESHOLD } from "@/features/attendance/constants";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import {
  calculateAnnualAverage,
  calculateWeightedTermAverage,
} from "@/features/grades/calculations";
import { PASSING_GRADE_THRESHOLD } from "@/features/grades/constants";
import { OCCURRENCE_TYPE_LABELS } from "@/features/occurrences/constants";
import { buildOccurrenceFamilyReceipts } from "@/features/occurrences/queries";
import type { OccurrenceItem } from "@/features/occurrences/types";
import { prisma } from "@/lib/prisma";
import type {
  AlertReason,
  ClassroomAttendanceChartItem,
  DashboardOverviewData,
  OccurrenceTypeChartItem,
  StudentAlertItem,
} from "./types";

const ptBrCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

/**
 * Consolida indicadores reais e agregacoes para graficos do painel inicial,
 * filtrados pelo perfil do usuario:
 * PROFESSOR visualiza apenas suas turmas; ADMIN/COORDENACAO visualizam toda a escola.
 */
export async function getDashboardOverviewForUser(
  user: PublicUser
): Promise<DashboardOverviewData> {
  const isManager = canManageClassrooms(user.role);
  const classroomScope = isManager ? {} : { teacherId: user.id };
  const occurrenceScope = isManager ? {} : { classroom: { teacherId: user.id } };

  const [
    classrooms,
    pendingOccurrencesCount,
    recentOccurrenceRows,
    occurrenceTypeGroups,
  ] = await Promise.all([
    prisma.classroom.findMany({
      where: classroomScope,
      orderBy: [{ year: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        subject: true,
      },
    }),
    prisma.occurrence.count({
      where: {
        status: OccurrenceStatus.PENDENTE,
        ...occurrenceScope,
      },
    }),
    prisma.occurrence.findMany({
      where: occurrenceScope,
      take: 5,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        studentId: true,
        classroomId: true,
        authorId: true,
        type: true,
        severity: true,
        description: true,
        status: true,
        resolutionNote: true,
        date: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            name: true,
            registration: true,
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            subject: true,
            shift: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    }),
    prisma.occurrence.groupBy({
      by: ["type"],
      where: occurrenceScope,
      _count: { _all: true },
    }),
  ]);

  const classroomIds = classrooms.map((item) => item.id);
  const classroomMap = new Map(classrooms.map((item) => [item.id, item]));

  let activeStudentsCount = 0;
  const alertStudents: StudentAlertItem[] = [];
  const attendanceByClassroom: ClassroomAttendanceChartItem[] = [];

  if (classroomIds.length > 0) {
    const [activeStudents, attendanceGroups, gradeRows, classroomAttendanceRows] =
      await Promise.all([
        prisma.student.findMany({
          where: {
            classroomId: { in: classroomIds },
            active: true,
          },
          select: {
            id: true,
            name: true,
            registration: true,
            classroomId: true,
          },
        }),
        prisma.attendance.groupBy({
          by: ["studentId", "status"],
          where: {
            student: {
              classroomId: { in: classroomIds },
              active: true,
            },
          },
          _count: { _all: true },
        }),
        prisma.grade.findMany({
          where: {
            student: {
              classroomId: { in: classroomIds },
              active: true,
            },
          },
          select: {
            studentId: true,
            score: true,
            assessment: {
              select: {
                term: true,
                maxScore: true,
                weight: true,
              },
            },
          },
        }),
        prisma.attendance.findMany({
          where: {
            lesson: {
              classroomId: { in: classroomIds },
            },
          },
          select: {
            status: true,
            lesson: {
              select: {
                classroomId: true,
              },
            },
          },
        }),
      ]);

    activeStudentsCount = activeStudents.length;

    const attendanceByStudent = new Map<
      string,
      { present: number; absent: number; justified: number }
    >();
    for (const group of attendanceGroups) {
      const current = attendanceByStudent.get(group.studentId) ?? {
        present: 0,
        absent: 0,
        justified: 0,
      };
      if (group.status === AttendanceStatus.PRESENTE) {
        current.present += group._count._all;
      } else if (group.status === AttendanceStatus.FALTA) {
        current.absent += group._count._all;
      } else if (group.status === AttendanceStatus.JUSTIFICADA) {
        current.justified += group._count._all;
      }
      attendanceByStudent.set(group.studentId, current);
    }

    const classroomTotals = new Map<
      string,
      { attended: number; total: number }
    >();
    for (const row of classroomAttendanceRows) {
      const classroomId = row.lesson.classroomId;
      const current = classroomTotals.get(classroomId) ?? {
        attended: 0,
        total: 0,
      };
      current.total += 1;
      if (
        row.status === AttendanceStatus.PRESENTE ||
        row.status === AttendanceStatus.JUSTIFICADA
      ) {
        current.attended += 1;
      }
      classroomTotals.set(classroomId, current);
    }

    for (const classroom of classrooms) {
      const totals = classroomTotals.get(classroom.id);
      if (!totals || totals.total === 0) {
        continue;
      }
      const rate = Math.round((totals.attended / totals.total) * 100);
      const shortSubject =
        classroom.subject.length > 10
          ? `${classroom.subject.slice(0, 9)}.`
          : classroom.subject;
      attendanceByClassroom.push({
        classroomId: classroom.id,
        classroomName: classroom.name,
        subject: classroom.subject,
        shortLabel: `${classroom.name} (${shortSubject})`,
        attendanceRate: rate,
        totalRecords: totals.total,
      });
    }

    const gradesByStudentTerm = new Map<
      string,
      Map<number, Array<{ score: number; maxScore: number; weight: number }>>
    >();
    for (const grade of gradeRows) {
      let termMap = gradesByStudentTerm.get(grade.studentId);
      if (!termMap) {
        termMap = new Map();
        gradesByStudentTerm.set(grade.studentId, termMap);
      }
      const list = termMap.get(grade.assessment.term) ?? [];
      list.push({
        score: grade.score,
        maxScore: grade.assessment.maxScore,
        weight: grade.assessment.weight,
      });
      termMap.set(grade.assessment.term, list);
    }

    for (const student of activeStudents) {
      const att = attendanceByStudent.get(student.id);
      const totalAtt = att ? att.present + att.absent + att.justified : 0;
      const attendanceRate =
        att && totalAtt > 0
          ? Math.round(((att.present + att.justified) / totalAtt) * 100)
          : null;

      const termMap = gradesByStudentTerm.get(student.id);
      const termAverages: Array<number | null> = [1, 2, 3].map((term) => {
        const items = termMap?.get(term) ?? [];
        return calculateWeightedTermAverage(items);
      });
      const overallAverage = calculateAnnualAverage(termAverages);

      const reasons: AlertReason[] = [];
      if (attendanceRate !== null && attendanceRate < LOW_ATTENDANCE_THRESHOLD) {
        reasons.push("LOW_ATTENDANCE");
      }
      if (overallAverage !== null && overallAverage < PASSING_GRADE_THRESHOLD) {
        reasons.push("LOW_GRADE");
      }

      if (reasons.length > 0) {
        const classroom = classroomMap.get(student.classroomId);
        alertStudents.push({
          studentId: student.id,
          studentName: student.name,
          registration: student.registration,
          classroomId: student.classroomId,
          classroomName: classroom?.name ?? "",
          classroomSubject: classroom?.subject ?? "",
          attendanceRate,
          overallAverage,
          reasons,
        });
      }
    }

    alertStudents.sort((a, b) => {
      if (b.reasons.length !== a.reasons.length) {
        return b.reasons.length - a.reasons.length;
      }
      return ptBrCollator.compare(a.studentName, b.studentName);
    });
  }

  const occurrencesByType: OccurrenceTypeChartItem[] = occurrenceTypeGroups
    .filter((group) => group._count._all > 0)
    .map((group) => ({
      type: group.type,
      label: OCCURRENCE_TYPE_LABELS[group.type],
      count: group._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const receiptMap = await buildOccurrenceFamilyReceipts(
    recentOccurrenceRows.map((row) => ({ id: row.id, studentId: row.studentId }))
  );

  const recentOccurrences: OccurrenceItem[] = recentOccurrenceRows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    canDelete: isManager || row.authorId === user.id,
    familyReceipt: receiptMap.get(row.id) ?? {
      status: "NO_GUARDIAN",
      acknowledgedAt: null,
      acknowledgedByName: null,
    },
  }));

  return {
    counters: {
      totalClassrooms: classrooms.length,
      activeStudentsCount,
      pendingOccurrencesCount,
      alertStudentsCount: alertStudents.length,
    },
    alertStudents,
    recentOccurrences,
    attendanceByClassroom,
    occurrencesByType,
  };
}
