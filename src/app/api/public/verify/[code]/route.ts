import { NextResponse, type NextRequest } from "next/server";
import { findPublicVerificationByCode } from "@/features/verifications/queries";
import type { PublicVerificationPayload } from "@/features/verifications/types";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

interface RouteContext {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/public/verify/[code]
 * Rota PUBLICA antifraude: valida codigo emitido sem expor PII sensivel.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<
  NextResponse<PublicVerificationPayload | { valid: false; error: string }>
> {
  const { code } = await context.params;

  try {
    const verification = await findPublicVerificationByCode(code);
    if (!verification) {
      return NextResponse.json(
        {
          valid: false,
          error: "Código de verificação não encontrado ou inválido.",
        },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(verification, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (error: unknown) {
    console.error("[GET /api/public/verify/[code]] Erro ao consultar código:", {
      operation: "verifications.publicGet",
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        valid: false,
        error: "Não foi possível validar o documento no momento.",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
