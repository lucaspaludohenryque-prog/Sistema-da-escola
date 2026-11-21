import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import {
  getSchoolConfig,
  updateSchoolConfigSchema,
  type SchoolConfigData,
} from "@/features/school-config";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/school-config
 * Rota publica para carregar nome, ano letivo e logo da escola (inclusive na tela de /login).
 */
export async function GET(): Promise<
  NextResponse<{ config: SchoolConfigData } | ApiErrorPayload>
> {
  try {
    const config = await getSchoolConfig();
    return NextResponse.json(
      { config },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/school-config] Erro ao carregar configuracao da escola:", {
      operation: "schoolConfig.get",
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar a identidade da escola.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * PUT /api/school-config
 * Atualiza a identidade institucional da escola (id: 1). Exclusivo para ADMIN.
 */
export async function PUT(
  request: NextRequest
): Promise<NextResponse<{ config: SchoolConfigData } | ApiErrorPayload>> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (currentUser.role !== "ADMIN") {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: "Apenas Administradores podem alterar as configurações da escola.",
        code: "FORBIDDEN",
      },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Corpo da requisição inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const parsed = updateSchoolConfigSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Dados da configuração escolar inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { name, city, state, phone, schoolYear, logoUrl } = parsed.data;

  try {
    const updated = await prisma.schoolConfig.upsert({
      where: { id: 1 },
      update: {
        name,
        city,
        state,
        phone,
        schoolYear,
        logoUrl,
      },
      create: {
        id: 1,
        name,
        city,
        state,
        phone,
        schoolYear,
        logoUrl,
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        phone: true,
        schoolYear: true,
        logoUrl: true,
        updatedAt: true,
      },
    });

    const config: SchoolConfigData = {
      ...updated,
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json(
      { config },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[PUT /api/school-config] Erro ao atualizar configuracao:", {
      operation: "schoolConfig.update",
      userId: currentUser.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível salvar as configurações da escola.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
