import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  type ApiErrorPayload,
} from "@/features/classrooms";
import {
  getGradeSheetForUser,
  isClassroomTermLocked,
  saveRecoveryBatchSchema,
  type GradeSheetData,
} from "@/features/grades";
import { recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * POST /api/grades/recovery
 * Salva notas de recuperacao paralela em lote para o trimestre selecionado,
 * respeitando permissoes por turma e bloqueio de trimestre trancado.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ sheet: GradeSheetData } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Corpo da requisição inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const parsed = saveRecoveryBatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Dados de recuperação inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { classroomId, term, entries } = parsed.data;

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        teacherId: true,
        students: { select: { id: true } },
      },
    });

    if (!classroom) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (!canManageClassrooms(user.role) && classroom.teacherId !== user.id) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Você não tem permissão para lançar recuperação nesta turma.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    if (await isClassroomTermLocked(classroomId, term)) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error:
            "Este trimestre está trancado. Destranque o trimestre antes de alterar notas de recuperação.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const studentIdSet = new Set(classroom.students.map((s) => s.id));
    for (const entry of entries) {
      if (!studentIdSet.has(entry.studentId)) {
        return NextResponse.json<ApiErrorPayload>(
          {
            error: "Um ou mais alunos informados não pertencem a esta turma.",
            code: "VALIDATION_ERROR",
          },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const entry of entries) {
        if (entry.score === null) {
          await tx.termRecovery.deleteMany({
            where: {
              classroomId,
              studentId: entry.studentId,
              term,
            },
          });
        } else {
          await tx.termRecovery.upsert({
            where: {
              classroomId_studentId_term: {
                classroomId,
                studentId: entry.studentId,
                term,
              },
            },
            update: { score: entry.score },
            create: {
              classroomId,
              studentId: entry.studentId,
              term,
              score: entry.score,
            },
          });
        }
      }
    });

    await recordAuditLog({
      user,
      action: "LANCAR_RECUPERACAO",
      entity: "TermRecovery",
      entityId: `${classroomId}:${term}`,
      details: `Salvou ${entries.length} nota(s) de recuperação paralela no ${term}º trimestre da turma ${classroomId}.`,
    });

    const refreshed = await getGradeSheetForUser({ classroomId, term, user });
    if (refreshed.status !== "ok") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Erro ao recarregar planilha de notas.", code: "INTERNAL_ERROR" },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { sheet: refreshed.data },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/grades/recovery] Erro ao salvar recuperacao:", {
      operation: "grades.recovery",
      userId: user.id,
      classroomId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível salvar as notas de recuperação.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
