import { Prisma, UserRole } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  type ApiErrorPayload,
} from "@/features/classrooms";
import {
  createFamilyLinkSchema,
  listAdminFamilyLinks,
  type AdminFamilyLinksPayload,
} from "@/features/family";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/admin/family-links
 * Lista todos os vinculos Responsavel-Aluno e contas de Aluno. Exclusivo ADMIN/COORDENACAO.
 */
export async function GET(): Promise<
  NextResponse<AdminFamilyLinksPayload | ApiErrorPayload>
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!canManageClassrooms(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso restrito à Administração e Coordenação.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const payload = await listAdminFamilyLinks();
    return NextResponse.json(payload, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (error: unknown) {
    console.error("[GET /api/admin/family-links] Erro ao listar vinculos:", {
      operation: "familyLinks.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar os vínculos familiares.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * POST /api/admin/family-links
 * Vincula um RESPONSAVEL a um Student (GuardianStudent) OU uma conta ALUNO a um Student.
 * Exclusivo ADMIN e COORDENACAO.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AdminFamilyLinksPayload | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!canManageClassrooms(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Apenas Administração ou Coordenação podem gerenciar vínculos.", code: "FORBIDDEN" },
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

  const parsed = createFamilyLinkSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados de vínculo inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    if (parsed.data.kind === "STUDENT_ACCOUNT") {
      const { userId, studentId } = parsed.data;
      const [account, student] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true, studentProfile: { select: { id: true } } },
        }),
        prisma.student.findUnique({
          where: { id: studentId },
          select: { id: true, userId: true },
        }),
      ]);

      if (!account || account.role !== UserRole.ALUNO) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Conta selecionada não encontrada ou sem perfil de Aluno.", code: "VALIDATION_ERROR" },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }

      if (!student) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Aluno não encontrado.", code: "NOT_FOUND" },
          { status: 404, headers: NO_STORE_HEADERS }
        );
      }

      if (account.studentProfile && account.studentProfile.id !== student.id) {
        return NextResponse.json<ApiErrorPayload>(
          {
            error: "Esta conta de acesso já está vinculada a outro aluno. Desvincule primeiro.",
            code: "CONFLICT",
          },
          { status: 409, headers: NO_STORE_HEADERS }
        );
      }

      if (student.userId && student.userId !== account.id) {
        return NextResponse.json<ApiErrorPayload>(
          {
            error: "Este aluno já possui outra conta de acesso vinculada. Desvincule primeiro.",
            code: "CONFLICT",
          },
          { status: 409, headers: NO_STORE_HEADERS }
        );
      }

      await prisma.student.update({
        where: { id: student.id },
        data: { userId: account.id },
      });
    } else {
      const { guardianId, studentId, relationship } = parsed.data;
      const [guardian, student] = await Promise.all([
        prisma.user.findUnique({
          where: { id: guardianId },
          select: { id: true, role: true },
        }),
        prisma.student.findUnique({
          where: { id: studentId },
          select: { id: true },
        }),
      ]);

      if (!guardian || guardian.role !== UserRole.RESPONSAVEL) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Usuário selecionado não possui perfil de Responsável.", code: "VALIDATION_ERROR" },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }

      if (!student) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Aluno não encontrado.", code: "NOT_FOUND" },
          { status: 404, headers: NO_STORE_HEADERS }
        );
      }

      await prisma.guardianStudent.create({
        data: {
          guardianId: guardian.id,
          studentId: student.id,
          relationship,
        },
      });
    }

    const updated = await listAdminFamilyLinks();
    return NextResponse.json(updated, {
      status: 201,
      headers: NO_STORE_HEADERS,
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Este vínculo já existe.", code: "CONFLICT" },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    console.error("[POST /api/admin/family-links] Erro ao criar vinculo:", {
      operation: "familyLinks.create",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível salvar o vínculo.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
