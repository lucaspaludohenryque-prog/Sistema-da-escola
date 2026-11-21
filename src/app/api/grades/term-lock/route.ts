import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  type ApiErrorPayload,
} from "@/features/classrooms";
import { toggleTermLockSchema } from "@/features/grades";
import { recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * PATCH /api/grades/term-lock
 * Exclusivo para ADMIN e COORDENACAO trancarem ou destrancarem um trimestre de uma turma.
 */
export async function PATCH(
  request: NextRequest
): Promise<
  NextResponse<{ isLocked: boolean; lockedAt: string | null } | ApiErrorPayload>
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!canManageClassrooms(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: "Apenas Administração e Coordenação podem trancar ou destrancar trimestres.",
        code: "FORBIDDEN",
      },
      { status: 403, headers: NO_STORE_HEADERS }
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

  const parsed = toggleTermLockSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Parâmetros de trancamento inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { classroomId, term, locked } = parsed.data;

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true },
    });

    if (!classroom) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const updated = await prisma.termLock.upsert({
      where: { classroomId_term: { classroomId, term } },
      update: {
        locked,
        lockedAt: locked ? new Date() : null,
        lockedById: locked ? user.id : null,
      },
      create: {
        classroomId,
        term,
        locked,
        lockedAt: locked ? new Date() : null,
        lockedById: locked ? user.id : null,
      },
      select: {
        locked: true,
        lockedAt: true,
      },
    });

    await recordAuditLog({
      user,
      action: locked ? "TRANCAR_TRIMESTRE" : "DESTRANCAR_TRIMESTRE",
      entity: "TermLock",
      entityId: `${classroomId}:${term}`,
      details: `${locked ? "Trancou" : "Destrancou"} o ${term}º trimestre da turma ${classroomId}.`,
    });

    return NextResponse.json(
      {
        isLocked: updated.locked,
        lockedAt: updated.lockedAt ? updated.lockedAt.toISOString() : null,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[PATCH /api/grades/term-lock] Erro ao atualizar trancamento:", {
      operation: "grades.termLock",
      userId: user.id,
      classroomId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível alterar o status do trimestre.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
