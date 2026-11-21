import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { BCRYPT_COST, getAuthenticatedUser } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import { updateUserSchema, type ManagedUser } from "@/features/users";
import { recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/users/[id]
 * Edita nome, e-mail, perfil, status active e opcionalmente redefine a senha.
 * Impede o ADMIN logado de desativar a propria conta ou remover seu perfil ADMIN.
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ user: ManagedUser } | ApiErrorPayload>> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (currentUser.role !== "ADMIN") {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Apenas Administradores podem editar usuários.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;
  if (!id || id.trim().length === 0) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Identificador de usuário inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
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

  const parsed = updateUserSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados do usuário inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { name, email, role, active, password } = parsed.data;

  if (id === currentUser.id) {
    if (!active) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Você não pode desativar a sua própria conta de Administrador.",
          code: "VALIDATION_ERROR",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (role !== "ADMIN") {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Você não pode remover o seu próprio perfil de Administrador.",
          code: "VALIDATION_ERROR",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Usuário não encontrado.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const emailInUse = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
      select: { id: true },
    });

    if (emailInUse) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Já existe outro usuário utilizando este e-mail.", code: "CONFLICT" },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    const passwordHash = password ? await bcrypt.hash(password, BCRYPT_COST) : undefined;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        active,
        ...(passwordHash ? { password: passwordHash } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            classrooms: true,
            occurrences: true,
          },
        },
      },
    });

    const user: ManagedUser = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      active: updated.active,
      classroomCount: updated._count.classrooms,
      occurrenceCount: updated._count.occurrences,
      createdAt: updated.createdAt.toISOString(),
    };

    await recordAuditLog({
      user: currentUser,
      action: active ? "EDITAR_USUARIO" : "DESATIVAR_USUARIO",
      entity: "User",
      entityId: updated.id,
      details: `${active ? "Atualizou" : "Desativou"} a conta de ${updated.name} (${updated.email}, perfil ${updated.role}).`,
    });

    return NextResponse.json(
      { user },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Já existe outro usuário utilizando este e-mail.", code: "CONFLICT" },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    console.error("[PUT /api/users/[id]] Erro ao atualizar usuario:", {
      operation: "users.update",
      userId: currentUser.id,
      targetUserId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível atualizar o usuário.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Exclui um usuario apenas se nao for a propria conta e nao possuir
 * turmas nem ocorrencias vinculadas.
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ success: true } | ApiErrorPayload>> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (currentUser.role !== "ADMIN") {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Apenas Administradores podem excluir usuários.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;
  if (!id || id.trim().length === 0) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Identificador de usuário inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  if (id === currentUser.id) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Você não pode excluir a sua própria conta.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            classrooms: true,
            occurrences: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Usuário não encontrado.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (existing._count.classrooms > 0 || existing._count.occurrences > 0) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error:
            "Este usuário possui turmas ou ocorrências vinculadas e não pode ser excluído. Desative a conta para bloquear o acesso preservando o histórico escolar.",
          code: "CONFLICT",
        },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    await prisma.user.delete({ where: { id } });

    await recordAuditLog({
      user: currentUser,
      action: "EXCLUIR_USUARIO",
      entity: "User",
      entityId: id,
      details: `Excluiu o usuário de ID ${id}.`,
    });

    return NextResponse.json(
      { success: true },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[DELETE /api/users/[id]] Erro ao excluir usuario:", {
      operation: "users.delete",
      userId: currentUser.id,
      targetUserId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível excluir o usuário.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
