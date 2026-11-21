import { AttendanceStatus, OccurrenceStatus } from "@prisma/client";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import {
  ACADEMIC_TERMS,
  calculateAnnualAverage,
  calculateFinalTermAverage,
  calculateWeightedTermAverage,
} from "@/features/grades";
import { prisma } from "@/lib/prisma";
import type {
  ClassroomSeatingData,
  SeatAssignmentRecord,
  SeatingStudentInfo,
} from "./types";

const ptBrCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

export type ClassroomSeatingResult =
  | { status: "ok"; data: ClassroomSeatingData }
  | { status: "not_found" }
  | { status: "forbidden" };

export async function getClassroomSeatingForUser(
  classroomId: string,
  user: PublicUser
): Promise<ClassroomSeatingResult> {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: {
      id: true,
      name: true,
      subject: true,
      year: true,
      teacherId: true,
      seatRows: true,
      seatCols: true,
      students: {
        where: { active: true },
        select: {
          id: true,
          name: true,
          registration: true,
        },
        orderBy: { name: "asc" },
      },
      seatAssignments: {
        select: {
          studentId: true,
          row: true,
          col: true,
        },
      },
      assessments: {
        select: {
          id: true,
          term: true,
          maxScore: true,
          weight: true,
          grades: {
            select: {
              studentId: true,
              score: true,
            },
          },
        },
      },
      termRecoveries: {
        select: {
          studentId: true,
          term: true,
          score: true,
        },
      },
    },
  });

  if (!classroom) {
    return { status: "not_found" };
  }

  if (!canManageClassrooms(user.role) && classroom.teacherId !== user.id) {
    return { status: "forbidden" };
  }

  const studentIds = classroom.students.map((s) => s.id);

  const [attGroups, pendingOccGroups] =
    studentIds.length > 0
      ? await Promise.all([
          prisma.attendance.groupBy({
            by: ["studentId", "status"],
            where: {
              studentId: { in: studentIds },
              lesson: { classroomId: classroom.id },
            },
            _count: { _all: true },
          }),
          prisma.occurrence.groupBy({
            by: ["studentId"],
            where: {
              studentId: { in: studentIds },
              classroomId: classroom.id,
              status: OccurrenceStatus.PENDENTE,
            },
            _count: { _all: true },
          }),
        ])
      : [[], []];

  const attMap = new Map<
    string,
    { present: number; absent: number; justified: number }
  >();
  for (const g of attGroups) {
    const cur = attMap.get(g.studentId) ?? {
      present: 0,
      absent: 0,
      justified: 0,
    };
    if (g.status === AttendanceStatus.PRESENTE) cur.present += g._count._all;
    else if (g.status === AttendanceStatus.FALTA) cur.absent += g._count._all;
    else cur.justified += g._count._all;
    attMap.set(g.studentId, cur);
  }

  const occMap = new Map<string, number>();
  for (const g of pendingOccGroups) {
    occMap.set(g.studentId, g._count._all);
  }

  const gradeLookup = new Map<string, number>();
  const assessmentsByTerm = new Map<number, typeof classroom.assessments>();
  for (const a of classroom.assessments) {
    const list = assessmentsByTerm.get(a.term) ?? [];
    list.push(a);
    assessmentsByTerm.set(a.term, list);
    for (const g of a.grades) {
      gradeLookup.set(`${a.id}:${g.studentId}`, g.score);
    }
  }

  const recoveryLookup = new Map<string, number>();
  for (const r of classroom.termRecoveries) {
    recoveryLookup.set(`${r.term}:${r.studentId}`, r.score);
  }

  const sortedStudents = [...classroom.students].sort((a, b) =>
    ptBrCollator.compare(a.name, b.name)
  );

  const studentInfoMap = new Map<string, SeatingStudentInfo>();
  const allStudents: SeatingStudentInfo[] = sortedStudents.map((student) => {
    const att = attMap.get(student.id) ?? {
      present: 0,
      absent: 0,
      justified: 0,
    };
    const totalLessons = att.present + att.absent + att.justified;
    const attendanceRate =
      totalLessons > 0
        ? Math.round(((att.present + att.justified) / totalLessons) * 100)
        : null;

    const termFinals = ACADEMIC_TERMS.map((term) => {
      const list = assessmentsByTerm.get(term) ?? [];
      const rawAvg = calculateWeightedTermAverage(
        list.map((a) => ({
          score: gradeLookup.get(`${a.id}:${student.id}`) ?? null,
          maxScore: a.maxScore,
          weight: a.weight,
        }))
      );
      const rec = recoveryLookup.get(`${term}:${student.id}`) ?? null;
      return calculateFinalTermAverage(rawAvg, rec);
    });

    const overallAverage = calculateAnnualAverage(termFinals);

    const info: SeatingStudentInfo = {
      id: student.id,
      name: student.name,
      registration: student.registration,
      attendanceRate,
      overallAverage,
      pendingOccurrencesCount: occMap.get(student.id) ?? 0,
    };
    studentInfoMap.set(student.id, info);
    return info;
  });

  const assignedStudentIds = new Set<string>();
  const assignments: SeatAssignmentRecord[] = [];

  for (const seat of classroom.seatAssignments) {
    const info = studentInfoMap.get(seat.studentId);
    if (
      info &&
      seat.row >= 0 &&
      seat.row < classroom.seatRows &&
      seat.col >= 0 &&
      seat.col < classroom.seatCols
    ) {
      assignedStudentIds.add(seat.studentId);
      assignments.push({
        studentId: seat.studentId,
        row: seat.row,
        col: seat.col,
        student: info,
      });
    }
  }

  const unassignedStudents = allStudents.filter(
    (student) => !assignedStudentIds.has(student.id)
  );

  return {
    status: "ok",
    data: {
      classroomId: classroom.id,
      classroomName: classroom.name,
      subject: classroom.subject,
      year: classroom.year,
      seatRows: classroom.seatRows,
      seatCols: classroom.seatCols,
      assignments,
      unassignedStudents,
      allStudents,
    },
  };
}
