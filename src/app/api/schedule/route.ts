import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import { listScheduleForUser } from "@/features/schedule/queries";
import type {
  ScheduleDayOfWeek,
  ScheduleSlotItem,
} from "@/features/schedule/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const upsertScheduleSchema = z.object({
  classroomId: z.string().trim().min(1, "Selecione uma turma."),
  dayOfWeek: z.coerce
    .number()
    .int()
    .min(1, "Selecione um dia útil (Segunda a Sexta).")
    .max(5, "Selecione um dia útil (Segunda a Sexta)."),
  lessonNumber: z.coerce
    .number()
    .int()
    .min(1, "Número da aula deve estar entre 1 e 6.")
    .max(6, "Número da aula deve estar entre 1 e 6."),
  startTime: z
    .string()
    .trim()
    .regex(TIME_REGEX, "Horário de início inválido (HH:MM)."),
  endTime: z
    .string()
    .trim()
    .regex(TIME_REGEX, "Horário de término inválido (HH:MM)."),
  room: z
    .string()
    .trim()
    .max(40, "A sala deve ter no máximo 40 caracteres.")
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ slots: ScheduleSlotItem[] } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const classroomId = request.nextUrl.searchParams.get("classroomId");

  try {
    const slots = await listScheduleForUser(user, classroomId);
    return NextResponse.json({ slots }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[GET /api/schedule] Erro ao carregar grade de horarios:", {
      operation: "schedule.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar a grade de horários.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ slot: ScheduleSlotItem } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Apenas a equipe escolar pode gerenciar horários.", code: "FORBIDDEN" },
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

  const parsed = upsertScheduleSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados do horário inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { classroomId, dayOfWeek, lessonNumber, startTime, endTime, room } =
    parsed.data;

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        name: true,
        subject: true,
        shift: true,
        teacherId: true,
        teacher: { select: { name: true } },
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
        { error: "Você não tem permissão para editar horários desta turma.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const saved = await prisma.scheduleSlot.upsert({
      where: {
        classroomId_dayOfWeek_lessonNumber: {
          classroomId,
          dayOfWeek,
          lessonNumber,
        },
      },
      update: { startTime, endTime, room },
      create: { classroomId, dayOfWeek, lessonNumber, startTime, endTime, room },
      select: {
        id: true,
        classroomId: true,
        dayOfWeek: true,
        lessonNumber: true,
        startTime: true,
        endTime: true,
        room: true,
      },
    });

    const slot: ScheduleSlotItem = {
      ...saved,
      dayOfWeek: saved.dayOfWeek as ScheduleDayOfWeek,
      classroom: {
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        shift: classroom.shift,
        teacherName: classroom.teacher.name,
      },
      canEdit: true,
    };

    return NextResponse.json({ slot }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[POST /api/schedule] Erro ao salvar horario:", {
      operation: "schedule.upsert",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível salvar o horário.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
