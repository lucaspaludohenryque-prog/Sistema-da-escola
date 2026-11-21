import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "./constants";
import type {
  ClassroomDetail,
  ClassroomSummary,
  StudentRecord,
  TeacherSummary,
} from "./types";

const ptBrCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

export function sortStudentsAlphabetically(students: StudentRecord[]): StudentRecord[] {
  return [...students].sort((a, b) => ptBrCollator.compare(a.name, b.name));
}

/**
 * Lista turmas de acordo com o perfil do usuario autenticado:
 * ADMIN/COORDENACAO visualizam todas; PROFESSOR visualiza apenas as proprias.
 */
export async function listClassroomsForUser(
  user: PublicUser
): Promise<ClassroomSummary[]> {
  const whereClause = canManageClassrooms(user.role)
    ? {}
    : { teacherId: user.id };

  const records = await prisma.classroom.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      subject: true,
      year: true,
      shift: true,
      teacherId: true,
      createdAt: true,
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });

  return records.map((classroom) => ({
    id: classroom.id,
    name: classroom.name,
    subject: classroom.subject,
    year: classroom.year,
    shift: classroom.shift,
    teacherId: classroom.teacherId,
    teacher: classroom.teacher,
    studentCount: classroom._count.students,
    createdAt: classroom.createdAt.toISOString(),
  }));
}

export type ClassroomDetailResult =
  | { status: "ok"; classroom: ClassroomDetail }
  | { status: "not_found" }
  | { status: "forbidden" };

/**
 * Recupera os detalhes de uma turma e seus alunos ordenados alfabeticamente (pt-BR),
 * validando propriedade quando o solicitante possui perfil PROFESSOR.
 */
export async function getClassroomDetailForUser(
  classroomId: string,
  user: PublicUser
): Promise<ClassroomDetailResult> {
  const record = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: {
      id: true,
      name: true,
      subject: true,
      year: true,
      shift: true,
      teacherId: true,
      createdAt: true,
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      students: {
        select: {
          id: true,
          name: true,
          registration: true,
          guardianName: true,
          guardianPhone: true,
          active: true,
          classroomId: true,
          createdAt: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!record) {
    return { status: "not_found" };
  }

  if (!canManageClassrooms(user.role) && record.teacherId !== user.id) {
    return { status: "forbidden" };
  }

  const students: StudentRecord[] = sortStudentsAlphabetically(
    record.students.map((student) => ({
      id: student.id,
      name: student.name,
      registration: student.registration,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      active: student.active,
      classroomId: student.classroomId,
      createdAt: student.createdAt.toISOString(),
    }))
  );

  return {
    status: "ok",
    classroom: {
      id: record.id,
      name: record.name,
      subject: record.subject,
      year: record.year,
      shift: record.shift,
      teacherId: record.teacherId,
      teacher: record.teacher,
      students,
      createdAt: record.createdAt.toISOString(),
    },
  };
}

/** Retorna todos os usuarios ativos com perfil PROFESSOR para selecao em cadastro de turmas. */
export async function listTeachers(): Promise<TeacherSummary[]> {
  return prisma.user.findMany({
    where: { role: UserRole.PROFESSOR, active: true },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });
}
