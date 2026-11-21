import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import { getDashboardOverviewForUser } from "@/features/dashboard/queries";
import type { DashboardOverviewData } from "@/features/dashboard/types";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/dashboard
 * Retorna indicadores reais, alunos em alerta (< 75% frequencia ou media < 6.0)
 * e as 5 ocorrencias mais recentes filtradas pelo perfil do usuario logado.
 */
export async function GET(): Promise<
  NextResponse<DashboardOverviewData | ApiErrorPayload>
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const overview = await getDashboardOverviewForUser(user);
    return NextResponse.json(overview, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (error: unknown) {
    console.error("[GET /api/dashboard] Erro ao carregar indicadores do painel:", {
      operation: "dashboard.overview",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar os dados do painel.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
