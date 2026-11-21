import { NextResponse } from "next/server";
import { getTodayIsoDate } from "@/features/attendance/constants";
import { getAuthenticatedUser } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import { recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/backup
 * Exclusivo para ADMIN. Exporta snapshot JSON completo dos dados escolares,
 * omitindo estritamente qualquer hash de senha dos usuarios.
 */
export async function GET(): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso exclusivo para Administradores.", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  try {
    const [
      schoolConfig,
      users,
      classrooms,
      students,
      lessons,
      attendances,
      assessments,
      grades,
      occurrences,
      announcements,
      meetings,
    ] = await Promise.all([
      prisma.schoolConfig.findUnique({ where: { id: 1 } }),
      // Selecao explicita SEM o campo password
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.classroom.findMany({ orderBy: [{ year: "desc" }, { name: "asc" }] }),
      prisma.student.findMany({ orderBy: { name: "asc" } }),
      prisma.lesson.findMany({ orderBy: { date: "desc" } }),
      prisma.attendance.findMany(),
      prisma.assessment.findMany({ orderBy: [{ term: "asc" }, { date: "asc" }] }),
      prisma.grade.findMany(),
      prisma.occurrence.findMany({ orderBy: { date: "desc" } }),
      prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.meeting.findMany({ orderBy: [{ date: "desc" }, { time: "desc" }] }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      schemaVersion: "rco-v3-phase13",
      counts: {
        users: users.length,
        classrooms: classrooms.length,
        students: students.length,
        lessons: lessons.length,
        attendances: attendances.length,
        assessments: assessments.length,
        grades: grades.length,
        occurrences: occurrences.length,
        announcements: announcements.length,
        meetings: meetings.length,
      },
      data: {
        schoolConfig,
        users,
        classrooms,
        students,
        lessons,
        attendances,
        assessments,
        grades,
        occurrences,
        announcements,
        meetings,
      },
    };

    await recordAuditLog({
      user,
      action: "EXPORTAR_BACKUP",
      entity: "Backup",
      entityId: getTodayIsoDate(),
      details: `Exportou backup completo JSON (${students.length} alunos, ${classrooms.length} turmas, ${lessons.length} aulas).`,
    });

    const filename = `rco-backup-${getTodayIsoDate()}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("[GET /api/admin/backup] Erro ao gerar backup:", {
      operation: "admin.backup",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível gerar o arquivo de backup.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
