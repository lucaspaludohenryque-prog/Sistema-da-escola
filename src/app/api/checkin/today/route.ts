import { NextResponse } from "next/server";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import { getTodayCheckInsForUser } from "@/features/checkin/queries";
import type { TodayCheckInsResponse } from "@/features/checkin/types";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/checkin/today
 * Retorna os ultimos 50 registros de portaria do dia atual (America/Sao_Paulo) e contadores.
 */
export async function GET(): Promise<
  NextResponse<TodayCheckInsResponse | ApiErrorPayload>
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: "Acesso restrito à equipe escolar.",
        code: "FORBIDDEN",
      },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const payload = await getTodayCheckInsForUser(user);
    return NextResponse.json(payload, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (error: unknown) {
    console.error("[GET /api/checkin/today] Erro ao carregar registros de hoje:", {
      operation: "checkin.today",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      {
        error: "Não foi possível carregar os registros de portaria de hoje.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
