import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import {
  attendanceQuerySchema,
  getAttendanceSheetForUser,
  saveAttendanceSchema,
  type AttendanceSheetData,
} from "@/features/attendance";
import {
  canManageClassrooms,
  type ApiErrorPayload,
} from "@/features/classrooms";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/attendance?classroomId=...&date=YYYY-MM-DD&lessonNumber=1
 * Retorna a aula (se existir), alunos ativos em ordem alfabetica com status salvo
 * (ou PRESENTE por padrao) e frequencia percentual consolidada na turma.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<AttendanceSheetData | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const params = request.nextUrl.searchParams;
  const parsed = attendanceQuerySchema.safeParse({
    classroomId: params.get("classroomId") ?? "",
    date: params.get("date") ?? "",
    lessonNumber: params.get("lessonNumber") ?? "1",
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Parâmetros de consulta inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const result = await getAttendanceSheetForUser({
      ...parsed.data,
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
          error: "Você não tem permissão para consultar a chamada desta turma.",
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
    console.error("[GET /api/attendance] Erro ao carregar chamada:", {
      operation: "attendance.get",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar os dados da chamada.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * POST /api/attendance
 * Salva ou atualiza em transacao unica (prisma.$transaction) o diario da aula
 * (Lesson) e os registros de frequencia (Attendance) de todos os alunos.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ sheet: AttendanceSheetData } | ApiErrorPayload>> {
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

  const parsed = saveAttendanceSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados da chamada inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { classroomId, date, lessonNumber, content, observations, records } =
    parsed.data;

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        teacherId: true,
        students: {
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
        {
          error: "Você não tem permissão para registrar chamada nesta turma.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const validStudentIds = new Set(classroom.students.map((student) => student.id));
    for (const record of records) {
      if (!validStudentIds.has(record.studentId)) {
        return NextResponse.json<ApiErrorPayload>(
          {
            error: "Um ou mais alunos informados não pertencem à turma selecionada.",
            code: "VALIDATION_ERROR",
          },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.upsert({
        where: {
          classroomId_date_lessonNumber: {
            classroomId,
            date,
            lessonNumber,
          },
        },
        update: {
          content,
          observations,
        },
        create: {
          classroomId,
          date,
          lessonNumber,
          content,
          observations,
        },
        select: { id: true },
      });

      for (const record of records) {
        await tx.attendance.upsert({
          where: {
            lessonId_studentId: {
              lessonId: lesson.id,
              studentId: record.studentId,
            },
          },
          update: {
            status: record.status,
          },
          create: {
            lessonId: lesson.id,
            studentId: record.studentId,
            status: record.status,
          },
        });
      }
    });

    const refreshed = await getAttendanceSheetForUser({
      classroomId,
      date,
      lessonNumber,
      user,
    });

    if (refreshed.status !== "ok") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Chamada salva, mas houve falha ao recarregar os dados.", code: "INTERNAL_ERROR" },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { sheet: refreshed.data },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/attendance] Erro ao salvar chamada:", {
      operation: "attendance.save",
      userId: user.id,
      classroomId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível salvar a chamada no momento.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
