import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  type ApiErrorPayload,
} from "@/features/classrooms";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/admin/family-links/[id]
 * Remove um vinculo GuardianStudent por id, ou desvincula a conta ALUNO
 * de um Student quando ?kind=student-account. Exclusivo ADMIN e COORDENACAO.
 */
export async function DELETE(
  request: NextRequest,
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
      { error: "Apenas Administração ou Coordenação podem remover vínculos.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;
  if (!id || id.trim().length === 0) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Identificador inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const kind = request.nextUrl.searchParams.get("kind");

  try {
    if (kind === "student-account") {
      const student = await prisma.student.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!student) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Aluno não encontrado.", code: "NOT_FOUND" },
          { status: 404, headers: NO_STORE_HEADERS }
        );
      }

      await prisma.student.update({
        where: { id },
        data: { userId: null },
      });

      return NextResponse.json(
        { success: true },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }

    const existing = await prisma.guardianStudent.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Vínculo não encontrado.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    await prisma.guardianStudent.delete({ where: { id } });

    return NextResponse.json(
      { success: true },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[DELETE /api/admin/family-links/[id]] Erro ao remover vinculo:", {
      operation: "familyLinks.delete",
      userId: user.id,
      targetId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível remover o vínculo.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
