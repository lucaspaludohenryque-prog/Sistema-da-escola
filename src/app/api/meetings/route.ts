import { MeetingMode, NotificationType, SchoolEventType } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { formatIsoDateBr } from "@/features/attendance/constants";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import { listMeetingsForUser } from "@/features/meetings/queries";
import { MEETING_MODES, type MeetingItem } from "@/features/meetings/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const createMeetingSchema = z.object({
  title: z
    .string({ required_error: "Informe o título da reunião." })
    .trim()
    .min(3, "O título deve ter ao menos 3 caracteres.")
    .max(140, "O título deve ter no máximo 140 caracteres."),
  studentId: z.string().trim().min(1, "Selecione um estudante."),
  guardianId: z.string().trim().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)."),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Horário inválido (HH:MM)."),
  mode: z.enum(MEETING_MODES).default("PRESENCIAL"),
  locationOrLink: z
    .string({ required_error: "Informe a sala ou o link da reunião." })
    .trim()
    .min(3, "Informe a sala ou o link da reunião.")
    .max(300),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  addToCalendar: z.boolean().optional().default(true),
});

export async function GET(): Promise<
  NextResponse<{ meetings: MeetingItem[] } | ApiErrorPayload>
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (user.role === "ALUNO") {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Agenda de reuniões restrita a Responsáveis e equipe escolar.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const meetings = await listMeetingsForUser(user);
    return NextResponse.json({ meetings }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[GET /api/meetings] Erro ao listar reuniões:", {
      operation: "meetings.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar as reuniões.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ meeting: MeetingItem; calendarEventCreated: boolean } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Apenas a equipe pedagógica pode agendar reuniões.", code: "FORBIDDEN" },
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

  const parsed = createMeetingSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados da reunião inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const {
    title,
    studentId,
    guardianId: requestedGuardianId,
    date,
    time,
    mode,
    locationOrLink,
    notes,
    addToCalendar,
  } = parsed.data;

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        classroomId: true,
        classroom: { select: { name: true, subject: true, teacherId: true } },
        guardianLinks: {
          select: {
            guardianId: true,
            guardian: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Estudante não encontrado.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (
      !canManageClassrooms(user.role) &&
      student.classroom.teacherId !== user.id
    ) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para agendar reunião nesta turma.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const link = requestedGuardianId
      ? student.guardianLinks.find((l) => l.guardianId === requestedGuardianId)
      : student.guardianLinks[0];

    if (!link) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Este estudante não possui responsável vinculado no portal.",
          code: "VALIDATION_ERROR",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const dateBr = formatIsoDateBr(date);

    const created = await prisma.$transaction(async (tx) => {
      const record = await tx.meeting.create({
        data: {
          title,
          studentId: student.id,
          guardianId: link.guardian.id,
          organizerId: user.id,
          date,
          time,
          mode: mode as MeetingMode,
          locationOrLink,
          notes,
          status: "CONVOCADA",
        },
      });

      await tx.notification.upsert({
        where: {
          recipientId_referenceKey: {
            recipientId: link.guardian.id,
            referenceKey: `MEET_${record.id}`,
          },
        },
        update: {},
        create: {
          recipientId: link.guardian.id,
          studentId: student.id,
          type: NotificationType.COMUNICADO,
          title: `Convocação de Reunião: ${title}`,
          message: `${user.name} agendou uma reunião (${mode === "ONLINE" ? "Online" : "Presencial"}) sobre ${student.name} para ${dateBr} às ${time}. Local/Link: ${locationOrLink}. Acesse Reuniões para confirmar presença.`,
          referenceKey: `MEET_${record.id}`,
        },
      });

      if (addToCalendar) {
        await tx.schoolEvent.create({
          data: {
            title: `Reunião: ${title} (${student.name})`,
            description: `Horário: ${time} · ${mode === "ONLINE" ? "Online" : "Presencial"} (${locationOrLink})`,
            date,
            type: SchoolEventType.REUNIAO,
            classroomId: student.classroomId,
            authorId: user.id,
          },
        });
      }

      return record;
    });

    const meeting: MeetingItem = {
      id: created.id,
      title: created.title,
      studentId: student.id,
      studentName: student.name,
      classroomName: student.classroom.name,
      classroomSubject: student.classroom.subject,
      guardianId: link.guardian.id,
      guardianName: link.guardian.name,
      organizerId: user.id,
      organizerName: user.name,
      date: created.date,
      time: created.time,
      mode: created.mode,
      locationOrLink: created.locationOrLink,
      notes: created.notes,
      status: created.status,
      guardianNote: created.guardianNote,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json(
      { meeting, calendarEventCreated: addToCalendar },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/meetings] Erro ao agendar reunião:", {
      operation: "meetings.create",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível agendar a reunião.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
