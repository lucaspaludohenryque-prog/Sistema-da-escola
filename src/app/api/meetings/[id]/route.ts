import { MeetingMode, MeetingStatus, NotificationType } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { formatIsoDateBr } from "@/features/attendance/constants";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import {
  MEETING_MODES,
  MEETING_STATUSES,
  type MeetingItem,
} from "@/features/meetings/types";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const guardianPatchSchema = z.object({
  status: z.enum(["CONFIRMADA", "REMARCAR"]),
  guardianNote: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

const staffPatchSchema = z.object({
  status: z.enum(MEETING_STATUSES).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .optional(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Horário inválido.")
    .optional(),
  mode: z.enum(MEETING_MODES).optional(),
  locationOrLink: z.string().trim().min(3).max(300).optional(),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ meeting: MeetingItem } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Corpo da requisição inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const existing = await prisma.meeting.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        studentId: true,
        guardianId: true,
        organizerId: true,
        date: true,
        time: true,
        mode: true,
        locationOrLink: true,
        notes: true,
        status: true,
        guardianNote: true,
        createdAt: true,
        student: {
          select: {
            name: true,
            classroom: { select: { name: true, subject: true, teacherId: true } },
          },
        },
        guardian: { select: { name: true } },
        organizer: { select: { name: true } },
      },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Reunião não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (user.role === "RESPONSAVEL") {
      if (existing.guardianId !== user.id) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Sem permissão para responder a esta reunião.", code: "FORBIDDEN" },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }

      const parsed = guardianPatchSchema.safeParse(rawBody);
      if (!parsed.success) {
        return NextResponse.json<ApiErrorPayload>(
          {
            error: parsed.error.issues[0]?.message ?? "Resposta inválida.",
            code: "VALIDATION_ERROR",
          },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }

      const updated = await prisma.meeting.update({
        where: { id },
        data: {
          status: parsed.data.status as MeetingStatus,
          guardianNote: parsed.data.guardianNote,
        },
      });

      return NextResponse.json(
        {
          meeting: {
            id: updated.id,
            title: updated.title,
            studentId: updated.studentId,
            studentName: existing.student.name,
            classroomName: existing.student.classroom.name,
            classroomSubject: existing.student.classroom.subject,
            guardianId: updated.guardianId,
            guardianName: existing.guardian.name,
            organizerId: updated.organizerId,
            organizerName: existing.organizer.name,
            date: updated.date,
            time: updated.time,
            mode: updated.mode,
            locationOrLink: updated.locationOrLink,
            notes: updated.notes,
            status: updated.status,
            guardianNote: updated.guardianNote,
            createdAt: updated.createdAt.toISOString(),
          },
        },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }

    if (!isStaffRole(user.role)) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Permissão insuficiente.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const canEdit =
      canManageClassrooms(user.role) ||
      existing.organizerId === user.id ||
      existing.student.classroom.teacherId === user.id;

    if (!canEdit) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para alterar esta reunião.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const parsed = staffPatchSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
          code: "VALIDATION_ERROR",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const data = parsed.data;
    const isRescheduled =
      (data.date && data.date !== existing.date) ||
      (data.time && data.time !== existing.time);

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.meeting.update({
        where: { id },
        data: {
          ...(data.status ? { status: data.status as MeetingStatus } : {}),
          ...(data.date ? { date: data.date } : {}),
          ...(data.time ? { time: data.time } : {}),
          ...(data.mode ? { mode: data.mode as MeetingMode } : {}),
          ...(data.locationOrLink ? { locationOrLink: data.locationOrLink } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });

      if (isRescheduled || data.status === "CANCELADA") {
        const refKey = `MEET_UPD_${record.id}_${Date.now()}`;
        await tx.notification.create({
          data: {
            recipientId: existing.guardianId,
            studentId: existing.studentId,
            type: NotificationType.COMUNICADO,
            title:
              data.status === "CANCELADA"
                ? `Reunião cancelada: ${existing.title}`
                : `Reunião atualizada: ${existing.title}`,
            message:
              data.status === "CANCELADA"
                ? `A reunião sobre ${existing.student.name} marcada para ${formatIsoDateBr(existing.date)} às ${existing.time} foi cancelada por ${user.name}.`
                : `Novo horário definido para a reunião sobre ${existing.student.name}: ${formatIsoDateBr(record.date)} às ${record.time} (${record.locationOrLink}).`,
            referenceKey: refKey,
          },
        });
      }

      return record;
    });

    return NextResponse.json(
      {
        meeting: {
          id: updated.id,
          title: updated.title,
          studentId: updated.studentId,
          studentName: existing.student.name,
          classroomName: existing.student.classroom.name,
          classroomSubject: existing.student.classroom.subject,
          guardianId: updated.guardianId,
          guardianName: existing.guardian.name,
          organizerId: updated.organizerId,
          organizerName: existing.organizer.name,
          date: updated.date,
          time: updated.time,
          mode: updated.mode,
          locationOrLink: updated.locationOrLink,
          notes: updated.notes,
          status: updated.status,
          guardianNote: updated.guardianNote,
          createdAt: updated.createdAt.toISOString(),
        },
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[PATCH /api/meetings/[id]] Erro ao atualizar reunião:", {
      operation: "meetings.patch",
      userId: user.id,
      meetingId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível atualizar a reunião.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
