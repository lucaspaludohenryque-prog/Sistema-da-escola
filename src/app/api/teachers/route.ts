import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  listTeachers,
  type ApiErrorPayload,
  type TeacherSummary,
} from "@/features/classrooms";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/teachers
 * Retorna a lista de usuarios com perfil PROFESSOR para cadastro de turmas.
 * Restrito a ADMIN e COORDENACAO.
 */
export async function GET(): Promise<
  NextResponse<{ teachers: TeacherSummary[] } | ApiErrorPayload>
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
        error: "Acesso restrito à Administração e Coordenação.",
        code: "FORBIDDEN",
      },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const teachers = await listTeachers();
    return NextResponse.json(
      { teachers },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/teachers] Erro ao listar professores:", {
      operation: "teachers.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar os professores.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
