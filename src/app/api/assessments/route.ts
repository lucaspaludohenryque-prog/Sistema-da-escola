import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  type ApiErrorPayload,
} from "@/features/classrooms";
import {
  createAssessmentSchema,
  type AcademicTerm,
  type AssessmentItem,
} from "@/features/grades";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * POST /api/assessments
 * Cria uma nova avaliacao na turma e trimestre informados.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ assessment: AssessmentItem } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
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

  const parsed = createAssessmentSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados da avaliação inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { classroomId, title, term, maxScore, weight, date } = parsed.data;

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, teacherId: true },
    });

    if (!classroom) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (!canManageClassrooms(user.role) && classroom.teacherId !== user.id) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Você não tem permissão para criar avaliações nesta turma.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const created = await prisma.assessment.create({
      data: {
        classroomId: classroom.id,
        title,
        term,
        maxScore,
        weight,
        date,
      },
      select: {
        id: true,
        classroomId: true,
        title: true,
        term: true,
        maxScore: true,
        weight: true,
        date: true,
        createdAt: true,
      },
    });

    const assessment: AssessmentItem = {
      id: created.id,
      classroomId: created.classroomId,
      title: created.title,
      term: created.term as AcademicTerm,
      maxScore: created.maxScore,
      weight: created.weight,
      date: created.date,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json(
      { assessment },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/assessments] Erro ao criar avaliacao:", {
      operation: "assessments.create",
      userId: user.id,
      classroomId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível criar a avaliação.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
