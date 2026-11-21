import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import type { AcademicTerm } from "@/features/grades/types";
import type { LessonPlanItem } from "@/features/lesson-plans/types";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const patchPlanSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, "O tema deve ter ao menos 3 caracteres.")
    .max(200)
    .optional(),
  objectives: z
    .string()
    .trim()
    .max(600)
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? undefined : v && v.length > 0 ? v : null)),
  plannedDate: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? undefined : v && v.length > 0 ? v : null))
    .refine((v) => v === undefined || v === null || ISO_DATE_REGEX.test(v), {
      message: "Data inválida.",
    }),
  status: z.enum(["PLANEJADO", "MINISTRADO"]).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ plan: LessonPlanItem } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso restrito à equipe escolar.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Corpo da requisição inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const parsed = patchPlanSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const existing = await prisma.lessonPlan.findUnique({
      where: { id },
      select: {
        id: true,
        classroom: { select: { teacherId: true } },
      },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Tópico de planejamento não encontrado.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (!canManageClassrooms(user.role) && existing.classroom.teacherId !== user.id) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para atualizar este planejamento.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const updated = await prisma.lessonPlan.update({
      where: { id },
      data: {
        ...(parsed.data.topic !== undefined ? { topic: parsed.data.topic } : {}),
        ...(parsed.data.objectives !== undefined
          ? { objectives: parsed.data.objectives }
          : {}),
        ...(parsed.data.plannedDate !== undefined
          ? { plannedDate: parsed.data.plannedDate }
          : {}),
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      },
    });

    const plan: LessonPlanItem = {
      id: updated.id,
      classroomId: updated.classroomId,
      term: updated.term as AcademicTerm,
      plannedDate: updated.plannedDate,
      topic: updated.topic,
      objectives: updated.objectives,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json({ plan }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[PATCH /api/lesson-plans/[id]] Erro ao atualizar plano:", {
      operation: "lessonPlans.patch",
      userId: user.id,
      planId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível atualizar o tópico.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

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

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso restrito à equipe escolar.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.lessonPlan.findUnique({
      where: { id },
      select: {
        id: true,
        classroom: { select: { teacherId: true } },
      },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Tópico de planejamento não encontrado.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (!canManageClassrooms(user.role) && existing.classroom.teacherId !== user.id) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para excluir este planejamento.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    await prisma.lessonPlan.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[DELETE /api/lesson-plans/[id]] Erro ao excluir plano:", {
      operation: "lessonPlans.delete",
      userId: user.id,
      planId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível excluir o tópico.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
