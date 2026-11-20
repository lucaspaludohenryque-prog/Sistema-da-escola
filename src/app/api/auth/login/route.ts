import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DUMMY_PASSWORD_HASH,
  attachSessionCookie,
  loginSchema,
  signSessionToken,
  type AuthErrorResponse,
  type AuthUserResponse,
  type PublicUser,
} from "@/features/auth";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * POST /api/auth/login
 * Valida credenciais (e-mail + senha com bcryptjs), emite JWT assinado via jose
 * e grava o token em cookie HTTP-only seguro.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthUserResponse | AuthErrorResponse>> {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json<AuthErrorResponse>(
      {
        error: "Corpo da requisição inválido.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const parsed = loginSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "Dados de login inválidos.";
    return NextResponse.json<AuthErrorResponse>(
      {
        error: firstMessage,
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { email, password } = parsed.data;

  try {
    const userRecord = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
      },
    });

    const hashToCompare = userRecord?.password ?? DUMMY_PASSWORD_HASH;
    const isPasswordValid = await bcrypt.compare(password, hashToCompare);

    if (!userRecord || !isPasswordValid) {
      return NextResponse.json<AuthErrorResponse>(
        {
          error: "E-mail ou senha incorretos",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const token = await signSessionToken({
      sub: userRecord.id,
      role: userRecord.role,
    });

    const publicUser: PublicUser = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      createdAt: userRecord.createdAt.toISOString(),
    };

    const response = NextResponse.json<AuthUserResponse>(
      { user: publicUser },
      { status: 200, headers: NO_STORE_HEADERS }
    );

    attachSessionCookie(response, token);
    return response;
  } catch (error: unknown) {
    console.error("[POST /api/auth/login] Erro interno ao autenticar usuario:", {
      operation: "auth.login",
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<AuthErrorResponse>(
      {
        error: "Não foi possível processar o login no momento. Tente novamente.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
