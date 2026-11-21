import type { Prisma } from "@prisma/client";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { prisma } from "@/lib/prisma";
import type {
  OccurrenceItem,
  OccurrenceSeverity,
  OccurrenceStatus,
} from "./types";

export interface OccurrenceListFilters {
  classroomId?: string;
  severity?: OccurrenceSeverity;
  status?: OccurrenceStatus;
  search?: string;
}

/**
 * Lista ocorrencias com controle de acesso por perfil (PROFESSOR ve apenas de suas turmas;
 * ADMIN/COORDENACAO veem todas) e filtros por turma, gravidade, status e nome do aluno.
 */
export async function listOccurrencesForUser(
  user: PublicUser,
  filters: OccurrenceListFilters = {}
): Promise<OccurrenceItem[]> {
  const isManager = canManageClassrooms(user.role);

  const whereClause: Prisma.OccurrenceWhereInput = {
    ...(isManager ? {} : { classroom: { teacherId: user.id } }),
    ...(filters.classroomId ? { classroomId: filters.classroomId } : {}),
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const records = await prisma.occurrence.findMany({
    where: whereClause,
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
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const normalizedSearch = filters.search?.trim().toLowerCase() ?? "";

  const filtered = normalizedSearch
    ? records.filter(
        (item) =>
          item.student.name.toLowerCase().includes(normalizedSearch) ||
          item.student.registration.toLowerCase().includes(normalizedSearch)
      )
    : records;

  return filtered.map((record) => ({
    id: record.id,
    studentId: record.studentId,
    classroomId: record.classroomId,
    authorId: record.authorId,
    type: record.type,
    severity: record.severity,
    description: record.description,
    status: record.status,
    resolutionNote: record.resolutionNote,
    date: record.date,
    createdAt: record.createdAt.toISOString(),
    canDelete: isManager || record.authorId === user.id,
    student: record.student,
    classroom: record.classroom,
    author: record.author,
  }));
}
