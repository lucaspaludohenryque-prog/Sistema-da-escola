import { AttendanceStatus, UserRole } from "@prisma/client";
import type { PublicUser } from "@/features/auth/types";
import {
  calculateAnnualAverage,
  calculateWeightedTermAverage,
} from "@/features/grades/calculations";
import { ACADEMIC_TERMS } from "@/features/grades/types";
import { countUnacknowledgedNotifications } from "@/features/notifications/queries";
import type { ReportTermSummary } from "@/features/reports/types";
import { prisma } from "@/lib/prisma";
import type {
  AdminFamilyLinksPayload,
  FamilyOverviewData,
  FamilyStudentOverview,
} from "./types";

const ptBrCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

/**
 * Monta o panorama somente leitura para RESPONSAVEL (todos os filhos vinculados)
 * ou ALUNO (apenas seu proprio perfil escolar).
 */
export async function getFamilyOverviewForUser(
  user: PublicUser
): Promise<FamilyOverviewData | null> {
  if (user.role !== "RESPONSAVEL" && user.role !== "ALUNO") {
    return null;
  }

  const unacknowledgedCount = await countUnacknowledgedNotifications(user.id);

  let targetStudentIds: string[] = [];
  const relationshipByStudentId = new Map<string, string>();

  if (user.role === "RESPONSAVEL") {
    const links = await prisma.guardianStudent.findMany({
      where: { guardianId: user.id },
      select: { studentId: true, relationship: true },
    });
    targetStudentIds = links.map((item) => item.studentId);
    for (const link of links) {
      relationshipByStudentId.set(link.studentId, link.relationship);
    }
  } else {
    const ownStudent = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (ownStudent) {
      targetStudentIds = [ownStudent.id];
    }
  }

  if (targetStudentIds.length === 0) {
    return {
      role: user.role,
      students: [],
      unacknowledgedCount,
    };
  }

  const studentRecords = await prisma.student.findMany({
    where: { id: { in: targetStudentIds } },
    select: {
      id: true,
      name: true,
      registration: true,
      guardianName: true,
      guardianPhone: true,
      active: true,
      classroom: {
        select: {
          id: true,
          name: true,
          subject: true,
          year: true,
          shift: true,
          teacher: { select: { name: true } },
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
          id: true,
          status: true,
          justification: {
            select: {
              id: true,
              status: true,
              reason: true,
              reviewNote: true,
            },
          },
          lesson: {
            select: {
              id: true,
              date: true,
              lessonNumber: true,
              content: true,
            },
          },
        },
        orderBy: [
          { lesson: { date: "desc" } },
          { lesson: { lessonNumber: "desc" } },
        ],
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
          author: { select: { name: true } },
        },
      },
    },
  });

  const overviews: FamilyStudentOverview[] = studentRecords
    .map((student) => {
      let presentCount = 0;
      let absentCount = 0;
      let justifiedCount = 0;

      const absences = [];
      for (const att of student.attendances) {
        if (att.status === AttendanceStatus.PRESENTE) {
          presentCount += 1;
        } else if (att.status === AttendanceStatus.FALTA) {
          absentCount += 1;
          absences.push({
            attendanceId: att.id,
            lessonId: att.lesson.id,
            date: att.lesson.date,
            lessonNumber: att.lesson.lessonNumber,
            subject: student.classroom.subject,
            classroomName: student.classroom.name,
            content: att.lesson.content,
            status: att.status,
            justification: att.justification,
          });
        } else {
          justifiedCount += 1;
          absences.push({
            attendanceId: att.id,
            lessonId: att.lesson.id,
            date: att.lesson.date,
            lessonNumber: att.lesson.lessonNumber,
            subject: student.classroom.subject,
            classroomName: student.classroom.name,
            content: att.lesson.content,
            status: att.status,
            justification: att.justification,
          });
        }
      }

      const totalLessons = presentCount + absentCount + justifiedCount;
      const attendanceRate =
        totalLessons > 0
          ? Math.round(((presentCount + justifiedCount) / totalLessons) * 100)
          : null;

      const gradeMap = new Map<string, number>();
      for (const grade of student.grades) {
        gradeMap.set(grade.assessmentId, grade.score);
      }

      const terms: ReportTermSummary[] = ACADEMIC_TERMS.map((term) => {
        const assessments = student.classroom.assessments
          .filter((a) => a.term === term)
          .map((a) => ({
            assessmentId: a.id,
            title: a.title,
            date: a.date,
            maxScore: a.maxScore,
            weight: a.weight,
            score: gradeMap.get(a.id) ?? null,
          }));

        const termAverage = calculateWeightedTermAverage(
          assessments.map((a) => ({
            score: a.score,
            maxScore: a.maxScore,
            weight: a.weight,
          }))
        );

        return { term, assessments, termAverage };
      });

      const annualAverage = calculateAnnualAverage(
        terms.map((t) => t.termAverage)
      );

      return {
        student: {
          id: student.id,
          name: student.name,
          registration: student.registration,
          guardianName: student.guardianName,
          guardianPhone: student.guardianPhone,
          active: student.active,
          relationship: relationshipByStudentId.get(student.id),
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
          absences,
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
      };
    })
    .sort((a, b) => ptBrCollator.compare(a.student.name, b.student.name));

  return {
    role: user.role,
    students: overviews,
    unacknowledgedCount,
  };
}

/**
 * Lista todos os vinculos GuardianStudent, contas ALUNO e seletores disponiveis
 * para gestao administrativa (ADMIN / COORDENACAO).
 */
export async function listAdminFamilyLinks(): Promise<AdminFamilyLinksPayload> {
  const [guardianLinks, studentUsers, guardians, students] = await Promise.all([
    prisma.guardianStudent.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        relationship: true,
        createdAt: true,
        guardian: {
          select: { id: true, name: true, email: true, active: true },
        },
        student: {
          select: {
            id: true,
            name: true,
            registration: true,
            classroom: { select: { id: true, name: true, subject: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: UserRole.ALUNO },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        studentProfile: {
          select: {
            id: true,
            name: true,
            registration: true,
            classroom: { select: { name: true, subject: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: UserRole.RESPONSAVEL, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.student.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        registration: true,
        userId: true,
        classroom: { select: { name: true, subject: true } },
      },
    }),
  ]);

  return {
    guardianLinks: guardianLinks.map((link) => ({
      id: link.id,
      relationship: link.relationship,
      createdAt: link.createdAt.toISOString(),
      guardian: link.guardian,
      student: link.student,
    })),
    studentAccounts: studentUsers
      .map((account) => ({
        userId: account.id,
        userName: account.name,
        userEmail: account.email,
        userActive: account.active,
        linkedStudent: account.studentProfile
          ? {
              id: account.studentProfile.id,
              name: account.studentProfile.name,
              registration: account.studentProfile.registration,
              classroomName: account.studentProfile.classroom.name,
              classroomSubject: account.studentProfile.classroom.subject,
            }
          : null,
      }))
      .sort((a, b) => ptBrCollator.compare(a.userName, b.userName)),
    availableGuardians: [...guardians].sort((a, b) =>
      ptBrCollator.compare(a.name, b.name)
    ),
    availableStudents: students
      .map((student) => ({
        id: student.id,
        name: student.name,
        registration: student.registration,
        classroomName: student.classroom.name,
        classroomSubject: student.classroom.subject,
        userId: student.userId,
      }))
      .sort((a, b) => ptBrCollator.compare(a.name, b.name)),
  };
}
