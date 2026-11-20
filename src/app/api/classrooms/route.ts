import { UserRole } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  createClassroomSchema,
  listClassroomsForUser,
  type ApiErrorPayload,
  type ClassroomSummary,
} from "@/features/classrooms";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/classrooms
 * ADMIN/COORDENACAO: todas as turmas; PROFESSOR: apenas suas turmas.
 */
export async function GET(): Promise<
  NextResponse<{ classrooms: ClassroomSummary[] } | ApiErrorPayload>
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const classrooms = await listClassroomsForUser(user);
    return NextResponse.json(
      { classrooms },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/classrooms] Erro ao listar turmas:", {
      operation: "classrooms.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar as turmas.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * POST /api/classrooms
 * Cria uma nova turma vinculada a um professor. Permitido apenas para ADMIN e COORDENACAO.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ classroom: ClassroomSummary } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!canManageClassrooms(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: "Apenas Administração ou Coordenação podem cadastrar turmas.",
        code: "FORBIDDEN",
      },
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

  const parsed = createClassroomSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados da turma inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { name, subject, year, shift, teacherId } = parsed.data;

  try {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!teacher || teacher.role !== UserRole.PROFESSOR) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Professor selecionado não encontrado ou sem perfil de Professor.",
          code: "VALIDATION_ERROR",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const created = await prisma.classroom.create({
      data: {
        name,
        subject,
        year,
        shift,
        teacherId: teacher.id,
      },
      select: {
        id: true,
        name: true,
        subject: true,
        year: true,
        shift: true,
        teacherId: true,
        createdAt: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const classroom: ClassroomSummary = {
      id: created.id,
      name: created.name,
      subject: created.subject,
      year: created.year,
      shift: created.shift,
      teacherId: created.teacherId,
      teacher: created.teacher,
      studentCount: 0,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json(
      { classroom },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/classrooms] Erro ao criar turma:", {
      operation: "classrooms.create",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível cadastrar a turma.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
