import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Permissão insuficiente.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.studentBadge.findUnique({
      where: { id },
      select: { id: true, awardedById: true },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Medalha não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (!canManageClassrooms(user.role) && existing.awardedById !== user.id) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para remover esta medalha.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    await prisma.studentBadge.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[DELETE /api/badges/[id]] Erro ao excluir medalha:", {
      operation: "badges.delete",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível remover a medalha.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
