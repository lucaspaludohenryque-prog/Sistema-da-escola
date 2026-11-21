import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import { getStudentCardsForUser } from "@/features/checkin/queries";
import type { StudentCardItem } from "@/features/checkin/types";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/students/card
 * Retorna dados de Carteirinha Estudantil Digital de acordo com o perfil autenticado.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<{ cards: StudentCardItem[] } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const studentId = request.nextUrl.searchParams.get("studentId");
  const classroomId = request.nextUrl.searchParams.get("classroomId");

  try {
    const cards = await getStudentCardsForUser(user, {
      studentId,
      classroomId,
    });

    return NextResponse.json(
      { cards },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/students/card] Erro ao carregar carteirinha:", {
      operation: "students.card.list",
      userId: user.id,
      role: user.role,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      {
        error: "Não foi possível carregar os dados da carteirinha digital.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
