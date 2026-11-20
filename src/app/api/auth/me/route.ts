import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  getAuthenticatedUser,
  type AuthErrorResponse,
  type AuthUserResponse,
} from "@/features/auth";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/auth/me
 * Retorna os dados do usuario autenticado (sem o campo password).
 */
export async function GET(): Promise<NextResponse<AuthUserResponse | AuthErrorResponse>> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      const response = NextResponse.json<AuthErrorResponse>(
        {
          error: "Sessão ausente ou expirada.",
          code: "UNAUTHORIZED",
        },
        { status: 401, headers: NO_STORE_HEADERS }
      );
      clearSessionCookie(response);
      return response;
    }

    return NextResponse.json<AuthUserResponse>(
      { user },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/auth/me] Erro ao recuperar sessao:", {
      operation: "auth.me",
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<AuthErrorResponse>(
      {
        error: "Erro interno ao verificar a sessão.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
