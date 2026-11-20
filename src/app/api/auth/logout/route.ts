import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/features/auth";

interface LogoutResponse {
  success: true;
}

/**
 * POST /api/auth/logout
 * Limpa o cookie HTTP-only de sessao e encerra a autenticacao no cliente.
 */
export async function POST(): Promise<NextResponse<LogoutResponse>> {
  const response = NextResponse.json<LogoutResponse>(
    { success: true },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );

  clearSessionCookie(response);
  return response;
}
