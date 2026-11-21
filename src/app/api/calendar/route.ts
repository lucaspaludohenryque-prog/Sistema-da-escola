import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import { listSchoolEventsForUser } from "@/features/calendar/queries";
import {
  SCHOOL_EVENT_TYPES,
  type SchoolEventItem,
} from "@/features/calendar/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const createEventSchema = z.object({
  title: z
    .string({ required_error: "Informe o título do evento." })
    .trim()
    .min(2, "O título deve ter ao menos 2 caracteres.")
    .max(120, "O título deve ter no máximo 120 caracteres."),
  description: z
    .string()
    .trim()
    .max(600, "A descrição deve ter no máximo 600 caracteres.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  date: z
    .string({ required_error: "Informe a data do evento." })
    .trim()
    .regex(ISO_DATE_REGEX, "A data deve estar no formato AAAA-MM-DD."),
  type: z.enum(SCHOOL_EVENT_TYPES, {
    errorMap: () => ({ message: "Tipo de evento inválido." }),
  }),
  classroomId: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ events: SchoolEventItem[] } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const month = request.nextUrl.searchParams.get("month");

  try {
    const events = await listSchoolEventsForUser(user, month);
    return NextResponse.json({ events }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[GET /api/calendar] Erro ao listar eventos:", {
      operation: "calendar.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar o calendário escolar.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ event: SchoolEventItem } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Apenas a equipe escolar pode criar eventos no calendário.", code: "FORBIDDEN" },
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

  const parsed = createEventSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados do evento inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { title, description, date, type, classroomId } = parsed.data;
  const isManager = canManageClassrooms(user.role);

  if (!isManager && !classroomId) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: "Professores devem vincular o evento a uma de suas turmas.",
        code: "FORBIDDEN",
      },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  try {
    let classroomLabel: string | null = null;
    if (classroomId) {
      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
        select: { id: true, name: true, subject: true, teacherId: true },
      });

      if (!classroom) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Turma não encontrada.", code: "NOT_FOUND" },
          { status: 404, headers: NO_STORE_HEADERS }
        );
      }

      if (!isManager && classroom.teacherId !== user.id) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Você não tem permissão para criar eventos nesta turma.", code: "FORBIDDEN" },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }

      classroomLabel = `${classroom.name} - ${classroom.subject}`;
    }

    const created = await prisma.schoolEvent.create({
      data: {
        title,
        description,
        date,
        type,
        classroomId,
        authorId: user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        type: true,
        classroomId: true,
        authorId: true,
        createdAt: true,
      },
    });

    const event: SchoolEventItem = {
      ...created,
      classroomLabel,
      authorName: user.name,
      canDelete: true,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json({ event }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[POST /api/calendar] Erro ao criar evento:", {
      operation: "calendar.create",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível criar o evento.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
