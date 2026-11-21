import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import { getBadgeSuggestionsForClassroom } from "@/features/badges/queries";
import type { BadgeSuggestionItem } from "@/features/badges/types";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ suggestions: BadgeSuggestionItem[] } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso restrito à equipe pedagógica.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const classroomId = request.nextUrl.searchParams.get("classroomId");
  if (!classroomId) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Informe o parâmetro classroomId.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const result = await getBadgeSuggestionsForClassroom(classroomId, user);
    if (result.status === "not_found") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }
    if (result.status === "forbidden") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para analisar esta turma.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { suggestions: result.suggestions },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/badges/suggestions] Erro ao gerar sugestões:", {
      operation: "badges.suggestions",
      userId: user.id,
      classroomId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível calcular sugestões de medalhas.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
