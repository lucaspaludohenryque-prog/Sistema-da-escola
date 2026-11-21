import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import {
  getStudentReportForUser,
  type StudentReportData,
} from "@/features/reports";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/students/[id]/report
 * Retorna o dossie completo do aluno (dados, frequencia, notas por trimestre e ocorrencias).
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ report: StudentReportData } | ApiErrorPayload>> {
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
      { error: "Identificador do aluno inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const result = await getStudentReportForUser(id, user);

    if (result.status === "not_found") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Aluno não encontrado.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (result.status === "forbidden") {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Você não tem permissão para consultar o boletim deste aluno.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { report: result.report },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/students/[id]/report] Erro ao gerar dossie do aluno:", {
      operation: "students.report",
      userId: user.id,
      studentId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível gerar o relatório do aluno.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
