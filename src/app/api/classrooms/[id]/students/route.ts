import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  createStudentSchema,
  type ApiErrorPayload,
  type StudentRecord,
} from "@/features/classrooms";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/classrooms/[id]/students
 * Cadastra um novo aluno na turma, validando matricula unica e permissao de acesso.
 */
export async function POST(
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

  const { id: classroomId } = await context.params;
  if (!classroomId || classroomId.trim().length === 0) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Identificador da turma inválido.", code: "VALIDATION_ERROR" },
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

  const parsed = createStudentSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados do aluno inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
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
        {
          error: "Você não tem permissão para adicionar alunos nesta turma.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const { name, registration, guardianName, guardianPhone, active } = parsed.data;

    const existingRegistration = await prisma.student.findUnique({
      where: { registration },
      select: { id: true },
    });

    if (existingRegistration) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Já existe um aluno cadastrado com esta matrícula/CGM.",
          code: "CONFLICT",
        },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    const created = await prisma.student.create({
      data: {
        name,
        registration,
        guardianName,
        guardianPhone,
        active,
        classroomId: classroom.id,
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
      ...created,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json(
      { student },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Já existe um aluno cadastrado com esta matrícula/CGM.",
          code: "CONFLICT",
        },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    console.error("[POST /api/classrooms/[id]/students] Erro ao cadastrar aluno:", {
      operation: "students.create",
      userId: user.id,
      classroomId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível cadastrar o aluno.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
