import { NextResponse } from "next/server";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import { getRadarAnalyticsForUser } from "@/features/radar/queries";
import type { RadarAnalyticsPayload } from "@/features/radar/types";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(): Promise<
  NextResponse<RadarAnalyticsPayload | ApiErrorPayload>
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
      { error: "Acesso restrito à equipe pedagógica.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const payload = await getRadarAnalyticsForUser(user);
    return NextResponse.json(payload, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[GET /api/analytics/radar] Erro ao calcular radar:", {
      operation: "analytics.radar",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar o radar de risco pedagógico.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
