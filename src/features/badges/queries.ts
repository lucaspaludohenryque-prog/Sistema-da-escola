import { AttendanceStatus, BadgeCategory } from "@prisma/client";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import {
  ACADEMIC_TERMS,
  calculateAnnualAverage,
  calculateFinalTermAverage,
  calculateWeightedTermAverage,
  formatScoreBr,
} from "@/features/grades";
import { prisma } from "@/lib/prisma";
import {
  BADGE_CATEGORY_META,
  type BadgeSuggestionItem,
  type StudentBadgeItem,
} from "./types";

export async function listBadgesForUser(
  user: PublicUser,
  filters?: { classroomId?: string; studentId?: string }
): Promise<StudentBadgeItem[]> {
  const isManager = canManageClassrooms(user.role);
  const whereClause: Record<string, unknown> = {};

  if (user.role === "ALUNO") {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!student) return [];
    whereClause.studentId = student.id;
  } else if (user.role === "RESPONSAVEL") {
    const links = await prisma.guardianStudent.findMany({
      where: { guardianId: user.id },
      select: { studentId: true },
    });
    if (links.length === 0) return [];
    whereClause.studentId = { in: links.map((l) => l.studentId) };
  } else if (user.role === "PROFESSOR") {
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: user.id },
      select: { id: true },
    });
    const allowedIds = classrooms.map((c) => c.id);
    if (allowedIds.length === 0) return [];
    if (filters?.classroomId) {
      if (!allowedIds.includes(filters.classroomId)) return [];
      whereClause.classroomId = filters.classroomId;
    } else {
      whereClause.classroomId = { in: allowedIds };
    }
    if (filters?.studentId) {
      whereClause.studentId = filters.studentId;
    }
  } else {
    if (filters?.classroomId) whereClause.classroomId = filters.classroomId;
    if (filters?.studentId) whereClause.studentId = filters.studentId;
  }

  const records = await prisma.studentBadge.findMany({
    where: whereClause,
    select: {
      id: true,
      studentId: true,
      classroomId: true,
      category: true,
      title: true,
      reason: true,
      awardedById: true,
      createdAt: true,
      student: { select: { name: true, registration: true } },
      classroom: { select: { name: true, subject: true } },
      awardedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return records.map((b) => ({
    id: b.id,
    studentId: b.studentId,
    studentName: b.student.name,
    studentRegistration: b.student.registration,
    classroomId: b.classroomId,
    classroomName: b.classroom.name,
    classroomSubject: b.classroom.subject,
    category: b.category,
    title: b.title,
    reason: b.reason,
    awardedById: b.awardedById,
    awardedByName: b.awardedBy.name,
    canDelete: isManager || b.awardedById === user.id,
    createdAt: b.createdAt.toISOString(),
  }));
}

export async function getBadgeSuggestionsForClassroom(
  classroomId: string,
  user: PublicUser
): Promise<{ status: "ok"; suggestions: BadgeSuggestionItem[] } | { status: "not_found" } | { status: "forbidden" }> {
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
          attendances: { select: { status: true } },
          grades: { select: { assessmentId: true, score: true } },
          termRecoveries: { select: { term: true, score: true } },
        },
        orderBy: { name: "asc" },
      },
      assessments: {
        select: { id: true, term: true, maxScore: true, weight: true },
      },
    },
  });

  if (!classroom) {
    return { status: "not_found" };
  }

  if (!canManageClassrooms(user.role) && classroom.teacherId !== user.id) {
    return { status: "forbidden" };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const existingThisMonth = await prisma.studentBadge.findMany({
    where: {
      classroomId: classroom.id,
      createdAt: { gte: monthStart },
    },
    select: { studentId: true, category: true },
  });

  const awardedSet = new Set(
    existingThisMonth.map((e) => `${e.studentId}:${e.category}`)
  );

  const assessmentsByTerm = new Map<number, typeof classroom.assessments>();
  for (const a of classroom.assessments) {
    const list = assessmentsByTerm.get(a.term) ?? [];
    list.push(a);
    assessmentsByTerm.set(a.term, list);
  }

  const suggestions: BadgeSuggestionItem[] = [];

  for (const student of classroom.students) {
    // 1. Frequencia 100% em pelo menos 3 aulas
    const totalLessons = student.attendances.length;
    const absentCount = student.attendances.filter(
      (a) => a.status === AttendanceStatus.FALTA
    ).length;

    if (
      totalLessons >= 3 &&
      absentCount === 0 &&
      !awardedSet.has(`${student.id}:${BadgeCategory.FREQUENCIA_100}`)
    ) {
      suggestions.push({
        studentId: student.id,
        studentName: student.name,
        studentRegistration: student.registration,
        classroomId: classroom.id,
        classroomName: classroom.name,
        classroomSubject: classroom.subject,
        category: "FREQUENCIA_100",
        suggestedTitle: BADGE_CATEGORY_META.FREQUENCIA_100.defaultTitle,
        suggestedReason: `Manteve 100% de presença nas ${totalLessons} aulas registradas de ${classroom.subject}.`,
        metricLabel: `100% (${totalLessons} aulas)`,
      });
    }

    // 2. Destaque Academico (media >= 8.5)
    const gradeMap = new Map(student.grades.map((g) => [g.assessmentId, g.score]));
    const recMap = new Map(student.termRecoveries.map((r) => [r.term, r.score]));

    const termFinals = ACADEMIC_TERMS.map((term) => {
      const list = assessmentsByTerm.get(term) ?? [];
      const rawAvg = calculateWeightedTermAverage(
        list.map((a) => ({
          score: gradeMap.get(a.id) ?? null,
          maxScore: a.maxScore,
          weight: a.weight,
        }))
      );
      return calculateFinalTermAverage(rawAvg, recMap.get(term) ?? null);
    });

    const overallAvg = calculateAnnualAverage(termFinals);
    if (
      overallAvg !== null &&
      overallAvg >= 8.5 &&
      !awardedSet.has(`${student.id}:${BadgeCategory.DESTAQUE_ACADEMICO}`)
    ) {
      suggestions.push({
        studentId: student.id,
        studentName: student.name,
        studentRegistration: student.registration,
        classroomId: classroom.id,
        classroomName: classroom.name,
        classroomSubject: classroom.subject,
        category: "DESTAQUE_ACADEMICO",
        suggestedTitle: BADGE_CATEGORY_META.DESTAQUE_ACADEMICO.defaultTitle,
        suggestedReason: `Alcançou média geral ${formatScoreBr(overallAvg)} em ${classroom.subject}.`,
        metricLabel: `Média ${formatScoreBr(overallAvg)}`,
      });
    }
  }

  return { status: "ok", suggestions };
}
