import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import {
  getFamilyOverviewForUser,
  type FamilyOverviewData,
} from "@/features/family";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/family/overview
 * Retorna dados escolares consolidados (somente leitura) dos filhos vinculados
 * para RESPONSAVEL, ou do proprio aluno para ALUNO.
 */
export async function GET(): Promise<
  NextResponse<FamilyOverviewData | ApiErrorPayload>
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (user.role !== "RESPONSAVEL" && user.role !== "ALUNO") {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Rota exclusiva para Responsáveis e Alunos.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const overview = await getFamilyOverviewForUser(user);
    if (!overview) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Acesso não autorizado.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(overview, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (error: unknown) {
    console.error("[GET /api/family/overview] Erro ao carregar panorama familiar:", {
      operation: "family.overview",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar os dados escolares.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
