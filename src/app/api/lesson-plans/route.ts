import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import type { AcademicTerm } from "@/features/grades/types";
import type { LessonPlanItem } from "@/features/lesson-plans/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const termSchema = z.coerce
  .number()
  .int()
  .refine((v): v is 1 | 2 | 3 => v === 1 || v === 2 || v === 3, {
    message: "Selecione o 1º, 2º ou 3º trimestre.",
  });

const createPlanSchema = z.object({
  classroomId: z.string().trim().min(1, "Selecione uma turma."),
  term: termSchema,
  plannedDate: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => v === null || ISO_DATE_REGEX.test(v), {
      message: "Data planejada deve estar no formato AAAA-MM-DD.",
    }),
  topic: z
    .string({ required_error: "Informe o tema da aula." })
    .trim()
    .min(3, "O tema deve ter ao menos 3 caracteres.")
    .max(200, "O tema deve ter no máximo 200 caracteres."),
  objectives: z
    .string()
    .trim()
    .max(600, "Os objetivos devem ter no máximo 600 caracteres.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ plans: LessonPlanItem[] } | ApiErrorPayload>> {
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

  const classroomId = request.nextUrl.searchParams.get("classroomId") ?? "";
  const termParsed = termSchema.safeParse(
    request.nextUrl.searchParams.get("term") ?? "1"
  );

  if (!classroomId || !termParsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Parâmetros classroomId e term são obrigatórios.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

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
        { error: "Sem permissão para consultar planejamento desta turma.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const rows = await prisma.lessonPlan.findMany({
      where: { classroomId, term: termParsed.data },
      orderBy: [{ plannedDate: "asc" }, { createdAt: "asc" }],
    });

    const plans: LessonPlanItem[] = rows.map((row) => ({
      id: row.id,
      classroomId: row.classroomId,
      term: row.term as AcademicTerm,
      plannedDate: row.plannedDate,
      topic: row.topic,
      objectives: row.objectives,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    return NextResponse.json({ plans }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[GET /api/lesson-plans] Erro ao listar planejamento:", {
      operation: "lessonPlans.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar o planejamento de aulas.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest
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

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Corpo da requisição inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const parsed = createPlanSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados do planejamento inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { classroomId, term, plannedDate, topic, objectives } = parsed.data;

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
        { error: "Sem permissão para editar planejamento desta turma.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const created = await prisma.lessonPlan.create({
      data: {
        classroomId,
        term,
        plannedDate,
        topic,
        objectives,
      },
    });

    const plan: LessonPlanItem = {
      id: created.id,
      classroomId: created.classroomId,
      term: created.term as AcademicTerm,
      plannedDate: created.plannedDate,
      topic: created.topic,
      objectives: created.objectives,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };

    return NextResponse.json({ plan }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[POST /api/lesson-plans] Erro ao criar tema:", {
      operation: "lessonPlans.create",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível salvar o tópico no plano de ensino.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
