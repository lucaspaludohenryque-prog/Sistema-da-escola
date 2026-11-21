import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import { formatIsoDateBr } from "@/features/attendance/constants";
import type { ApiErrorPayload } from "@/features/classrooms";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { OCCURRENCE_TYPE_LABELS } from "@/features/occurrences/constants";
import { NOTIFICATION_TYPE_LABELS } from "@/features/notifications/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export type GlobalSearchCategory =
  | "STUDENT"
  | "CLASSROOM"
  | "OCCURRENCE"
  | "NOTIFICATION";

export interface GlobalSearchResultItem {
  id: string;
  category: GlobalSearchCategory;
  title: string;
  subtitle: string;
  meta?: string;
  href: string;
}

export interface GlobalSearchResponse {
  query: string;
  results: GlobalSearchResultItem[];
}

/**
 * GET /api/search?q=...
 * Busca global instantanea protegida por JWT e filtrada pelo perfil do usuario.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<GlobalSearchResponse | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const rawQuery = request.nextUrl.searchParams.get("q") ?? "";
  const query = rawQuery.trim().slice(0, 80);

  if (query.length < 2) {
    return NextResponse.json<GlobalSearchResponse>(
      { query, results: [] },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const results: GlobalSearchResultItem[] = [];

    if (user.role === "RESPONSAVEL" || user.role === "ALUNO") {
      let linkedStudentIds: string[] = [];

      if (user.role === "RESPONSAVEL") {
        const links = await prisma.guardianStudent.findMany({
          where: { guardianId: user.id },
          select: { studentId: true },
        });
        linkedStudentIds = links.map((link) => link.studentId);
      } else {
        const ownStudent = await prisma.student.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (ownStudent) {
          linkedStudentIds = [ownStudent.id];
        }
      }

      const [notifications, occurrences, students] = await Promise.all([
        prisma.notification.findMany({
          where: {
            recipientId: user.id,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { message: { contains: query, mode: "insensitive" } },
              { student: { name: { contains: query, mode: "insensitive" } } },
            ],
          },
          take: 6,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            acknowledgedAt: true,
          },
        }),
        linkedStudentIds.length > 0
          ? prisma.occurrence.findMany({
              where: {
                studentId: { in: linkedStudentIds },
                OR: [
                  { description: { contains: query, mode: "insensitive" } },
                  { student: { name: { contains: query, mode: "insensitive" } } },
                ],
              },
              take: 5,
              orderBy: [{ date: "desc" }, { createdAt: "desc" }],
              select: {
                id: true,
                type: true,
                date: true,
                description: true,
                student: { select: { name: true } },
              },
            })
          : Promise.resolve([]),
        linkedStudentIds.length > 0
          ? prisma.student.findMany({
              where: {
                id: { in: linkedStudentIds },
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { registration: { contains: query, mode: "insensitive" } },
                ],
              },
              take: 4,
              select: {
                id: true,
                name: true,
                registration: true,
                classroom: { select: { name: true, subject: true } },
              },
            })
          : Promise.resolve([]),
      ]);

      for (const student of students) {
        results.push({
          id: `student:${student.id}`,
          category: "STUDENT",
          title: student.name,
          subtitle: `${student.classroom.name} - ${student.classroom.subject}`,
          meta: student.registration,
          href: `/dashboard/alunos/${student.id}/ficha`,
        });
      }

      for (const item of notifications) {
        results.push({
          id: `notification:${item.id}`,
          category: "NOTIFICATION",
          title: item.title,
          subtitle: item.message,
          meta: item.acknowledgedAt
            ? `${NOTIFICATION_TYPE_LABELS[item.type]} · Ciente`
            : `${NOTIFICATION_TYPE_LABELS[item.type]} · Pendente`,
          href: "/dashboard/avisos",
        });
      }

      const occurrenceTarget =
        user.role === "RESPONSAVEL"
          ? "/dashboard/familia#ocorrencias"
          : "/dashboard/aluno#ocorrencias";

      for (const occ of occurrences) {
        results.push({
          id: `occurrence:${occ.id}`,
          category: "OCCURRENCE",
          title: `${OCCURRENCE_TYPE_LABELS[occ.type]} · ${occ.student.name}`,
          subtitle: occ.description,
          meta: formatIsoDateBr(occ.date),
          href: occurrenceTarget,
        });
      }
    } else {
      const isManager = canManageClassrooms(user.role);
      const classroomScope = isManager ? {} : { teacherId: user.id };
      const relationClassroomScope = isManager
        ? {}
        : { classroom: { teacherId: user.id } };

      const [students, classrooms, occurrences] = await Promise.all([
        prisma.student.findMany({
          where: {
            ...relationClassroomScope,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { registration: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 6,
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            registration: true,
            classroom: { select: { name: true, subject: true } },
          },
        }),
        prisma.classroom.findMany({
          where: {
            ...classroomScope,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { subject: { contains: query, mode: "insensitive" } },
              { teacher: { name: { contains: query, mode: "insensitive" } } },
            ],
          },
          take: 5,
          orderBy: [{ year: "desc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            subject: true,
            year: true,
            teacher: { select: { name: true } },
          },
        }),
        prisma.occurrence.findMany({
          where: {
            ...relationClassroomScope,
            OR: [
              { description: { contains: query, mode: "insensitive" } },
              { student: { name: { contains: query, mode: "insensitive" } } },
            ],
          },
          take: 5,
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            type: true,
            date: true,
            description: true,
            student: { select: { name: true } },
            classroom: { select: { name: true } },
          },
        }),
      ]);

      for (const student of students) {
        results.push({
          id: `student:${student.id}`,
          category: "STUDENT",
          title: student.name,
          subtitle: `${student.classroom.name} - ${student.classroom.subject}`,
          meta: student.registration,
          href: `/dashboard/alunos/${student.id}/ficha`,
        });
      }

      for (const classroom of classrooms) {
        results.push({
          id: `classroom:${classroom.id}`,
          category: "CLASSROOM",
          title: `${classroom.name} · ${classroom.subject}`,
          subtitle: `Prof. ${classroom.teacher.name}`,
          meta: String(classroom.year),
          href: `/dashboard/turmas/${classroom.id}`,
        });
      }

      for (const occ of occurrences) {
        results.push({
          id: `occurrence:${occ.id}`,
          category: "OCCURRENCE",
          title: `${OCCURRENCE_TYPE_LABELS[occ.type]} · ${occ.student.name}`,
          subtitle: occ.description,
          meta: `${occ.classroom.name} · ${formatIsoDateBr(occ.date)}`,
          href: "/dashboard/ocorrencias",
        });
      }
    }

    return NextResponse.json<GlobalSearchResponse>(
      { query, results },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/search] Erro na busca global:", {
      operation: "search.global",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível executar a busca.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
