import { AttendanceStatus } from "@prisma/client";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import {
  calculateAnnualAverage,
  calculateWeightedTermAverage,
} from "@/features/grades/calculations";
import { ACADEMIC_TERMS } from "@/features/grades/types";
import { getSchoolConfig } from "@/features/school-config";
import { prisma } from "@/lib/prisma";
import type { ReportTermSummary, StudentReportData } from "./types";

export type StudentReportResult =
  | { status: "ok"; report: StudentReportData }
  | { status: "not_found" }
  | { status: "forbidden" };

/**
 * Monta o dossie completo do estudante (dados pessoais, frequencia, notas por trimestre
 * e historico de ocorrencias), validando permissao de acesso por turma.
 */
export async function getStudentReportForUser(
  studentId: string,
  user: PublicUser
): Promise<StudentReportResult> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      registration: true,
      guardianName: true,
      guardianPhone: true,
      active: true,
      userId: true,
      createdAt: true,
      guardianLinks: {
        select: {
          guardianId: true,
        },
      },
      classroom: {
        select: {
          id: true,
          name: true,
          subject: true,
          year: true,
          shift: true,
          teacherId: true,
          teacher: {
            select: {
              name: true,
            },
          },
          assessments: {
            select: {
              id: true,
              title: true,
              term: true,
              maxScore: true,
              weight: true,
              date: true,
              createdAt: true,
            },
            orderBy: [{ term: "asc" }, { date: "asc" }, { createdAt: "asc" }],
          },
        },
      },
      attendances: {
        select: {
          status: true,
        },
      },
      grades: {
        select: {
          assessmentId: true,
          score: true,
        },
      },
      occurrences: {
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          date: true,
          type: true,
          severity: true,
          status: true,
          description: true,
          resolutionNote: true,
          author: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    return { status: "not_found" };
  }

  const isAuthorized =
    canManageClassrooms(user.role) ||
    (user.role === "PROFESSOR" && student.classroom.teacherId === user.id) ||
    (user.role === "RESPONSAVEL" &&
      student.guardianLinks.some((link) => link.guardianId === user.id)) ||
    (user.role === "ALUNO" && student.userId === user.id);

  if (!isAuthorized) {
    return { status: "forbidden" };
  }

  let presentCount = 0;
  let absentCount = 0;
  let justifiedCount = 0;
  for (const att of student.attendances) {
    if (att.status === AttendanceStatus.PRESENTE) presentCount += 1;
    else if (att.status === AttendanceStatus.FALTA) absentCount += 1;
    else if (att.status === AttendanceStatus.JUSTIFICADA) justifiedCount += 1;
  }

  const totalLessons = presentCount + absentCount + justifiedCount;
  const attendanceRate =
    totalLessons > 0
      ? Math.round(((presentCount + justifiedCount) / totalLessons) * 100)
      : null;

  const gradeByAssessment = new Map<string, number>();
  for (const grade of student.grades) {
    gradeByAssessment.set(grade.assessmentId, grade.score);
  }

  const terms: ReportTermSummary[] = ACADEMIC_TERMS.map((term) => {
    const termAssessments = student.classroom.assessments
      .filter((item) => item.term === term)
      .map((item) => ({
        assessmentId: item.id,
        title: item.title,
        date: item.date,
        maxScore: item.maxScore,
        weight: item.weight,
        score: gradeByAssessment.get(item.id) ?? null,
      }));

    const termAverage = calculateWeightedTermAverage(
      termAssessments.map((item) => ({
        score: item.score,
        maxScore: item.maxScore,
        weight: item.weight,
      }))
    );

    return {
      term,
      assessments: termAssessments,
      termAverage,
    };
  });

  const annualAverage = calculateAnnualAverage(
    terms.map((item) => item.termAverage)
  );
  const school = await getSchoolConfig();

  return {
    status: "ok",
    report: {
      generatedAt: new Date().toISOString(),
      school,
      student: {
        id: student.id,
        name: student.name,
        registration: student.registration,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        active: student.active,
        createdAt: student.createdAt.toISOString(),
      },
      classroom: {
        id: student.classroom.id,
        name: student.classroom.name,
        subject: student.classroom.subject,
        year: student.classroom.year,
        shift: student.classroom.shift,
        teacherName: student.classroom.teacher.name,
      },
      attendance: {
        totalLessons,
        presentCount,
        absentCount,
        justifiedCount,
        attendanceRate,
      },
      terms,
      annualAverage,
      occurrences: student.occurrences.map((item) => ({
        id: item.id,
        date: item.date,
        type: item.type,
        severity: item.severity,
        status: item.status,
        description: item.description,
        resolutionNote: item.resolutionNote,
        authorName: item.author.name,
      })),
    },
  };
}
