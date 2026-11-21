import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  type ApiErrorPayload,
} from "@/features/classrooms";
import {
  updateOccurrenceSchema,
  type OccurrenceItem,
} from "@/features/occurrences";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/occurrences/[id]
 * Atualiza o status (PENDENTE / RESOLVIDO) e encaminhamento (resolutionNote).
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ occurrence: OccurrenceItem } | ApiErrorPayload>> {
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
      { error: "Identificador da ocorrência inválido.", code: "VALIDATION_ERROR" },
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

  const parsed = updateOccurrenceSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados de atualização inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const existing = await prisma.occurrence.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        classroom: {
          select: { teacherId: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Ocorrência não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const isManager = canManageClassrooms(user.role);
    const hasAccess =
      isManager ||
      existing.authorId === user.id ||
      existing.classroom.teacherId === user.id;

    if (!hasAccess) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Você não tem permissão para atualizar esta ocorrência.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const updated = await prisma.occurrence.update({
      where: { id },
      data: {
        status: parsed.data.status,
        resolutionNote: parsed.data.resolutionNote,
      },
      select: {
        id: true,
        studentId: true,
        classroomId: true,
        authorId: true,
        type: true,
        severity: true,
        description: true,
        status: true,
        resolutionNote: true,
        date: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            name: true,
            registration: true,
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            subject: true,
            shift: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    const occurrence: OccurrenceItem = {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      canDelete: isManager || updated.authorId === user.id,
    };

    return NextResponse.json(
      { occurrence },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[PATCH /api/occurrences/[id]] Erro ao atualizar ocorrencia:", {
      operation: "occurrences.update",
      userId: user.id,
      occurrenceId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível atualizar a ocorrência.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * DELETE /api/occurrences/[id]
 * Exclui a ocorrencia. Permitido apenas para ADMIN, COORDENACAO ou o proprio autor.
 */
export async function DELETE(
  _request: NextRequest,
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
      { error: "Identificador da ocorrência inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const existing = await prisma.occurrence.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Ocorrência não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const canDelete = canManageClassrooms(user.role) || existing.authorId === user.id;
    if (!canDelete) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Apenas Administração, Coordenação ou o autor podem excluir esta ocorrência.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    await prisma.occurrence.delete({ where: { id } });

    return NextResponse.json(
      { success: true },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[DELETE /api/occurrences/[id]] Erro ao excluir ocorrencia:", {
      operation: "occurrences.delete",
      userId: user.id,
      occurrenceId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível excluir a ocorrência.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
