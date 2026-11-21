import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  type ApiErrorPayload,
} from "@/features/classrooms";
import {
  getGradeSheetForUser,
  gradeQuerySchema,
  saveGradesBatchSchema,
  type GradeSheetData,
} from "@/features/grades";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/grades?classroomId=...&term=1
 * Retorna avaliacoes do trimestre, alunos ativos ordenados alfabeticamente,
 * notas lancadas e media ponderada calculada por aluno.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<GradeSheetData | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const params = request.nextUrl.searchParams;
  const parsed = gradeQuerySchema.safeParse({
    classroomId: params.get("classroomId") ?? "",
    term: params.get("term") ?? "1",
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Parâmetros de consulta inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const result = await getGradeSheetForUser({
      classroomId: parsed.data.classroomId,
      term: parsed.data.term,
      user,
    });

    if (result.status === "not_found") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (result.status === "forbidden") {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Você não tem permissão para consultar as notas desta turma.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(result.data, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (error: unknown) {
    console.error("[GET /api/grades] Erro ao carregar planilha de notas:", {
      operation: "grades.get",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar as notas.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * POST /api/grades
 * Salva/atualiza um lote de notas em transacao unica (prisma.$transaction),
 * validando 0 <= score <= maxScore para cada avaliacao.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ sheet: GradeSheetData } | ApiErrorPayload>> {
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

  const parsed = saveGradesBatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados de notas inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { classroomId, term, entries } = parsed.data;

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        teacherId: true,
        students: { select: { id: true } },
        assessments: {
          where: { term },
          select: { id: true, title: true, maxScore: true },
        },
      },
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
          error: "Você não tem permissão para lançar notas nesta turma.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const studentIdSet = new Set(classroom.students.map((s) => s.id));
    const assessmentMap = new Map(classroom.assessments.map((a) => [a.id, a]));

    for (const entry of entries) {
      if (!studentIdSet.has(entry.studentId)) {
        return NextResponse.json<ApiErrorPayload>(
          {
            error: "Um ou mais alunos informados não pertencem a esta turma.",
            code: "VALIDATION_ERROR",
          },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }

      const assessment = assessmentMap.get(entry.assessmentId);
      if (!assessment) {
        return NextResponse.json<ApiErrorPayload>(
          {
            error: "Uma ou mais avaliações informadas não pertencem a este trimestre.",
            code: "VALIDATION_ERROR",
          },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }

      if (entry.score !== null) {
        if (entry.score < 0 || entry.score > assessment.maxScore) {
          return NextResponse.json<ApiErrorPayload>(
            {
              error: `A nota em "${assessment.title}" deve estar entre 0 e ${assessment.maxScore}.`,
              code: "VALIDATION_ERROR",
            },
            { status: 400, headers: NO_STORE_HEADERS }
          );
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const entry of entries) {
        if (entry.score === null) {
          await tx.grade.deleteMany({
            where: {
              assessmentId: entry.assessmentId,
              studentId: entry.studentId,
            },
          });
        } else {
          await tx.grade.upsert({
            where: {
              assessmentId_studentId: {
                assessmentId: entry.assessmentId,
                studentId: entry.studentId,
              },
            },
            update: {
              score: entry.score,
            },
            create: {
              assessmentId: entry.assessmentId,
              studentId: entry.studentId,
              score: entry.score,
            },
          });
        }
      }
    });

    const refreshed = await getGradeSheetForUser({
      classroomId,
      term,
      user,
    });

    if (refreshed.status !== "ok") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Notas salvas, mas houve erro ao recarregar os dados.", code: "INTERNAL_ERROR" },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { sheet: refreshed.data },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/grades] Erro ao salvar lote de notas:", {
      operation: "grades.save",
      userId: user.id,
      classroomId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível salvar as notas no momento.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
