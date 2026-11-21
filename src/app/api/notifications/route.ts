import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import {
  listNotificationsForUser,
  type NotificationsResponse,
} from "@/features/notifications";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/notifications
 * Retorna os avisos do usuario autenticado (RESPONSAVEL ou ALUNO) e a contagem
 * de avisos pendentes de confirmacao de leitura.
 */
export async function GET(): Promise<
  NextResponse<NotificationsResponse | ApiErrorPayload>
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const payload = await listNotificationsForUser(user.id);
    return NextResponse.json(payload, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (error: unknown) {
    console.error("[GET /api/notifications] Erro ao carregar avisos:", {
      operation: "notifications.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar os avisos.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
