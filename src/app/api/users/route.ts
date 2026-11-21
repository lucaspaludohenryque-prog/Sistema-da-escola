import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { BCRYPT_COST, getAuthenticatedUser } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import {
  createUserSchema,
  listManagedUsers,
  type ManagedUser,
} from "@/features/users";
import { recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/users
 * Retorna todos os usuarios ordenados por nome (sem password) com contagem de turmas.
 * Acesso exclusivo para ADMIN.
 */
export async function GET(): Promise<
  NextResponse<{ users: ManagedUser[] } | ApiErrorPayload>
> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (currentUser.role !== "ADMIN") {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso exclusivo para Administradores.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const users = await listManagedUsers();
    return NextResponse.json(
      { users },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/users] Erro ao listar usuarios:", {
      operation: "users.list",
      userId: currentUser.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar os usuários.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * POST /api/users
 * Cadastra um novo usuario com senha criptografada via bcryptjs.
 * Acesso exclusivo para ADMIN.
 */
export async function POST(
  request: NextRequest
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
      { error: "Apenas Administradores podem cadastrar usuários.", code: "FORBIDDEN" },
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

  const parsed = createUserSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados do usuário inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { name, email, role, password, active } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Já existe um usuário cadastrado com este e-mail.", code: "CONFLICT" },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    const created = await prisma.user.create({
      data: {
        name,
        email,
        role,
        password: passwordHash,
        active,
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
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      active: created.active,
      classroomCount: created._count.classrooms,
      occurrenceCount: created._count.occurrences,
      createdAt: created.createdAt.toISOString(),
    };

    await recordAuditLog({
      user: currentUser,
      action: "CRIAR_USUARIO",
      entity: "User",
      entityId: created.id,
      details: `Cadastrou o usuário ${created.name} (${created.email}) com perfil ${created.role}.`,
    });

    return NextResponse.json(
      { user },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Já existe um usuário cadastrado com este e-mail.", code: "CONFLICT" },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    console.error("[POST /api/users] Erro ao cadastrar usuario:", {
      operation: "users.create",
      userId: currentUser.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível cadastrar o usuário.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
