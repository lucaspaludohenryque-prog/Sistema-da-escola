import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import { getClassroomSeatingForUser } from "@/features/seating/queries";
import type { ClassroomSeatingData } from "@/features/seating/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const saveSeatingSchema = z.object({
  seatRows: z
    .number()
    .int()
    .min(2, "Mínimo de 2 fileiras.")
    .max(10, "Máximo de 10 fileiras."),
  seatCols: z
    .number()
    .int()
    .min(2, "Mínimo de 2 colunas.")
    .max(10, "Máximo de 10 colunas."),
  assignments: z.array(
    z.object({
      studentId: z.string().trim().min(1),
      row: z.number().int().min(0),
      col: z.number().int().min(0),
    })
  ),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ClassroomSeatingData | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso restrito à equipe pedagógica.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const { id: classroomId } = await context.params;

  try {
    const result = await getClassroomSeatingForUser(classroomId, user);
    if (result.status === "not_found") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }
    if (result.status === "forbidden") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para visualizar o mapa desta turma.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(result.data, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[GET /api/classrooms/[id]/seating] Erro ao carregar mapa:", {
      operation: "seating.get",
      userId: user.id,
      classroomId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar o mapa de sala.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ClassroomSeatingData | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso restrito à equipe pedagógica.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const { id: classroomId } = await context.params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Corpo da requisição inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const parsed = saveSeatingSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados do mapa de sala inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { seatRows, seatCols, assignments } = parsed.data;

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        teacherId: true,
        students: {
          where: { active: true },
          select: { id: true },
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
        { error: "Sem permissão para alterar o mapa desta turma.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const validStudentIds = new Set(classroom.students.map((s) => s.id));
    const seenStudents = new Set<string>();
    const seenCoords = new Set<string>();

    for (const item of assignments) {
      if (!validStudentIds.has(item.studentId)) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Um ou mais estudantes não pertencem a esta turma.", code: "VALIDATION_ERROR" },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }
      if (item.row >= seatRows || item.col >= seatCols) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Uma carteira excede as dimensões definidas da sala.", code: "VALIDATION_ERROR" },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }
      if (seenStudents.has(item.studentId)) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Estudante duplicado no mapa de sala.", code: "VALIDATION_ERROR" },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }
      const coordKey = `${item.row}:${item.col}`;
      if (seenCoords.has(coordKey)) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Duas alocações apontam para a mesma carteira.", code: "VALIDATION_ERROR" },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }
      seenStudents.add(item.studentId);
      seenCoords.add(coordKey);
    }

    await prisma.$transaction(async (tx) => {
      await tx.classroom.update({
        where: { id: classroomId },
        data: { seatRows, seatCols },
      });

      await tx.seatAssignment.deleteMany({
        where: { classroomId },
      });

      if (assignments.length > 0) {
        await tx.seatAssignment.createMany({
          data: assignments.map((item) => ({
            classroomId,
            studentId: item.studentId,
            row: item.row,
            col: item.col,
          })),
        });
      }
    });

    const refreshed = await getClassroomSeatingForUser(classroomId, user);
    if (refreshed.status !== "ok") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Mapa salvo, mas houve falha ao recarregar os dados.", code: "INTERNAL_ERROR" },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(refreshed.data, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[PUT /api/classrooms/[id]/seating] Erro ao salvar mapa:", {
      operation: "seating.save",
      userId: user.id,
      classroomId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível salvar o mapa de sala.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
