import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  listLessonsForClassroom,
  type LessonHistoryItem,
} from "@/features/attendance";
import type { ApiErrorPayload } from "@/features/classrooms";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/lessons?classroomId=...
 * Retorna o historico de aulas registradas da turma ordenado da mais recente para a mais antiga.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<{ lessons: LessonHistoryItem[] } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const classroomId = request.nextUrl.searchParams.get("classroomId")?.trim() ?? "";
  if (!classroomId) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Informe o identificador da turma (classroomId).", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const result = await listLessonsForClassroom(classroomId, user);

    if (result.status === "not_found") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (result.status === "forbidden") {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Você não tem permissão para consultar o histórico desta turma.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { lessons: result.lessons },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/lessons] Erro ao listar historico de aulas:", {
      operation: "lessons.list",
      userId: user.id,
      classroomId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar o histórico de chamadas.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
