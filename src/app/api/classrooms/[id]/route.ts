import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  getClassroomDetailForUser,
  type ApiErrorPayload,
  type ClassroomDetail,
} from "@/features/classrooms";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/classrooms/[id]
 * Retorna dados da turma e lista de alunos ordenada alfabeticamente,
 * verificando se o professor logado e titular da turma.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ classroom: ClassroomDetail } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;
  if (!id || id.trim().length === 0) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Identificador da turma inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const result = await getClassroomDetailForUser(id, user);

    if (result.status === "not_found") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (result.status === "forbidden") {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Você não tem permissão para acessar esta turma.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { classroom: result.classroom },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/classrooms/[id]] Erro ao buscar turma:", {
      operation: "classrooms.detail",
      userId: user.id,
      classroomId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar os dados da turma.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * DELETE /api/classrooms/[id]
 * Remove uma turma e seus alunos vinculados (cascade). Permitido apenas para ADMIN e COORDENACAO.
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ success: true } | ApiErrorPayload>> {
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
        error: "Apenas Administração ou Coordenação podem excluir turmas.",
        code: "FORBIDDEN",
      },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;
  if (!id || id.trim().length === 0) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Identificador da turma inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const existing = await prisma.classroom.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    await prisma.classroom.delete({ where: { id } });

    return NextResponse.json(
      { success: true },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[DELETE /api/classrooms/[id]] Erro ao excluir turma:", {
      operation: "classrooms.delete",
      userId: user.id,
      classroomId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível excluir a turma.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
