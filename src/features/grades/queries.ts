import { AttendanceStatus } from "@prisma/client";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { prisma } from "@/lib/prisma";
import {
  calculateAnnualAverage,
  calculateFinalTermAverage,
  calculateWeightedTermAverage,
  determineStudentFinalStatus,
} from "./calculations";
import {
  ACADEMIC_TERMS,
  type AcademicTerm,
  type AssessmentItem,
  type GradeSheetData,
  type GradeStudentRow,
} from "./types";

const ptBrCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

export type GradeSheetResult =
  | { status: "ok"; data: GradeSheetData }
  | { status: "not_found" }
  | { status: "forbidden" };

export async function isClassroomTermLocked(
  classroomId: string,
  term: number
): Promise<boolean> {
  const lock = await prisma.termLock.findUnique({
    where: { classroomId_term: { classroomId, term } },
    select: { locked: true },
  });
  return Boolean(lock?.locked);
}

/**
 * Carrega avaliacoes do trimestre, notas, recuperacao paralela, status de trancamento,
 * medias finais de todos os trimestres, media anual, frequencia e situacao final.
 */
export async function getGradeSheetForUser(params: {
  classroomId: string;
  term: AcademicTerm;
  user: PublicUser;
}): Promise<GradeSheetResult> {
  const { classroomId, term, user } = params;

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
      assessments: {
        select: {
          id: true,
          classroomId: true,
          title: true,
          term: true,
          maxScore: true,
          weight: true,
          date: true,
          createdAt: true,
          grades: {
            select: {
              studentId: true,
              score: true,
            },
          },
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      },
      termRecoveries: {
        select: {
          studentId: true,
          term: true,
          score: true,
        },
      },
      termLocks: {
        where: { term },
        select: {
          locked: true,
          lockedAt: true,
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

  const activeStudentIds = classroom.students.map((s) => s.id);
  const attendanceGroups =
    activeStudentIds.length > 0
      ? await prisma.attendance.groupBy({
          by: ["studentId", "status"],
          where: {
            studentId: { in: activeStudentIds },
            lesson: { classroomId: classroom.id },
          },
          _count: { _all: true },
        })
      : [];

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

  const currentTermAssessmentsRaw = classroom.assessments.filter(
    (a) => a.term === term
  );
  const assessments: AssessmentItem[] = currentTermAssessmentsRaw.map((item) => ({
    id: item.id,
    classroomId: item.classroomId,
    title: item.title,
    term: item.term as AcademicTerm,
    maxScore: item.maxScore,
    weight: item.weight,
    date: item.date,
    createdAt: item.createdAt.toISOString(),
  }));

  const assessmentsByTerm = new Map<number, typeof classroom.assessments>();
  for (const a of classroom.assessments) {
    const list = assessmentsByTerm.get(a.term) ?? [];
    list.push(a);
    assessmentsByTerm.set(a.term, list);
  }

  const gradeLookup = new Map<string, number>();
  for (const assessment of classroom.assessments) {
    for (const grade of assessment.grades) {
      gradeLookup.set(`${assessment.id}:${grade.studentId}`, grade.score);
    }
  }

  const recoveryLookup = new Map<string, number>();
  for (const rec of classroom.termRecoveries) {
    recoveryLookup.set(`${rec.term}:${rec.studentId}`, rec.score);
  }

  const sortedStudents = [...classroom.students].sort((a, b) =>
    ptBrCollator.compare(a.name, b.name)
  );

  const studentRows: GradeStudentRow[] = sortedStudents.map((student) => {
    const scores: Record<string, number | null> = {};
    for (const assessment of assessments) {
      scores[assessment.id] =
        gradeLookup.get(`${assessment.id}:${student.id}`) ?? null;
    }

    const termFinals: Record<AcademicTerm, number | null> = {
      1: null,
      2: null,
      3: null,
    };

    let currentTermOriginalAvg: number | null = null;

    for (const t of ACADEMIC_TERMS) {
      const termAssessments = assessmentsByTerm.get(t) ?? [];
      const weightedItems = termAssessments.map((assessment) => ({
        score: gradeLookup.get(`${assessment.id}:${student.id}`) ?? null,
        maxScore: assessment.maxScore,
        weight: assessment.weight,
      }));
      const avg = calculateWeightedTermAverage(weightedItems);
      const rec = recoveryLookup.get(`${t}:${student.id}`) ?? null;
      const finalAvg = calculateFinalTermAverage(avg, rec);

      termFinals[t] = finalAvg;
      if (t === term) {
        currentTermOriginalAvg = avg;
      }
    }

    const recoveryScore = recoveryLookup.get(`${term}:${student.id}`) ?? null;
    const finalTermAverage = termFinals[term];
    const termFinalList = [termFinals[1], termFinals[2], termFinals[3]];
    const gradedTermsCount = termFinalList.filter((v) => v !== null).length;
    const annualAverage = calculateAnnualAverage(termFinalList);

    const att = attendanceByStudent.get(student.id);
    const totalAtt = att ? att.present + att.absent + att.justified : 0;
    const attendanceRate =
      att && totalAtt > 0
        ? Math.round(((att.present + att.justified) / totalAtt) * 100)
        : null;

    const finalStatus = determineStudentFinalStatus(
      annualAverage,
      attendanceRate,
      gradedTermsCount
    );

    return {
      studentId: student.id,
      name: student.name,
      registration: student.registration,
      scores,
      termAverage: currentTermOriginalAvg,
      recoveryScore,
      finalTermAverage,
      termFinals,
      annualAverage,
      attendanceRate,
      finalStatus,
    };
  });

  const lockRow = classroom.termLocks[0];

  return {
    status: "ok",
    data: {
      classroomId: classroom.id,
      classroomName: classroom.name,
      classroomSubject: classroom.subject,
      term,
      isLocked: Boolean(lockRow?.locked),
      lockedAt: lockRow?.lockedAt ? lockRow.lockedAt.toISOString() : null,
      assessments,
      students: studentRows,
    },
  };
}
