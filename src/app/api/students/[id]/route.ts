import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  updateStudentSchema,
  type ApiErrorPayload,
  type StudentRecord,
} from "@/features/classrooms";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/students/[id]
 * Atualiza os dados cadastrais e status ativo do aluno.
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ student: StudentRecord } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;
  if (!id || id.trim().length === 0) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Identificador do aluno inválido.", code: "VALIDATION_ERROR" },
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

  const parsed = updateStudentSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados do aluno inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const existing = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        active: true,
        classroom: {
          select: { id: true, teacherId: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Aluno não encontrado.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (!canManageClassrooms(user.role) && existing.classroom.teacherId !== user.id) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Você não tem permissão para editar alunos desta turma.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const { name, registration, guardianName, guardianPhone, active } = parsed.data;

    const duplicate = await prisma.student.findFirst({
      where: {
        registration,
        NOT: { id },
      },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Já existe outro aluno cadastrado com esta matrícula/CGM.",
          code: "CONFLICT",
        },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        name,
        registration,
        guardianName,
        guardianPhone,
        active: active ?? existing.active,
      },
      select: {
        id: true,
        name: true,
        registration: true,
        guardianName: true,
        guardianPhone: true,
        active: true,
        classroomId: true,
        createdAt: true,
      },
    });

    const student: StudentRecord = {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    };

    return NextResponse.json(
      { student },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Já existe outro aluno cadastrado com esta matrícula/CGM.",
          code: "CONFLICT",
        },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    console.error("[PUT /api/students/[id]] Erro ao atualizar aluno:", {
      operation: "students.update",
      userId: user.id,
      studentId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível atualizar os dados do aluno.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * DELETE /api/students/[id]
 * Remove o aluno da turma (ou desativa quando ?mode=deactivate).
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ success: true } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;
  if (!id || id.trim().length === 0) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Identificador do aluno inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const existing = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        classroom: {
          select: { id: true, teacherId: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Aluno não encontrado.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (!canManageClassrooms(user.role) && existing.classroom.teacherId !== user.id) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Você não tem permissão para remover alunos desta turma.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const mode = request.nextUrl.searchParams.get("mode");
    if (mode === "deactivate") {
      await prisma.student.update({
        where: { id },
        data: { active: false },
      });
    } else {
      await prisma.student.delete({ where: { id } });
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[DELETE /api/students/[id]] Erro ao excluir aluno:", {
      operation: "students.delete",
      userId: user.id,
      studentId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível remover o aluno.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
