import {
  AttendanceStatus,
  JustificationStatus,
  NotificationType,
} from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { formatIsoDateBr } from "@/features/attendance/constants";
import { getAuthenticatedUser } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import { countPendingJustifications } from "@/features/justifications/queries";
import type { AbsenceJustificationItem } from "@/features/justifications/types";
import { recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const reviewSchema = z.object({
  status: z.enum(["APROVADA", "RECUSADA"]),
  reviewNote: z
    .string()
    .trim()
    .max(500, "O parecer deve ter no máximo 500 caracteres.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<
  NextResponse<
    { justification: AbsenceJustificationItem; pendingCount: number } | ApiErrorPayload
  >
> {
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
        error: "Apenas Coordenação e Administração podem avaliar justificativas.",
        code: "FORBIDDEN",
      },
      { status: 403, headers: NO_STORE_HEADERS }
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

  const parsed = reviewSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Decisão inválida.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { status, reviewNote } = parsed.data;

  try {
    const existing = await prisma.absenceJustification.findUnique({
      where: { id },
      select: {
        id: true,
        attendanceId: true,
        studentId: true,
        guardianId: true,
        student: {
          select: {
            name: true,
            registration: true,
            classroom: { select: { name: true, subject: true } },
          },
        },
        attendance: {
          select: {
            lesson: { select: { date: true, lessonNumber: true } },
          },
        },
        guardian: {
          select: { name: true, email: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Justificativa não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.absenceJustification.update({
        where: { id },
        data: {
          status:
            status === "APROVADA"
              ? JustificationStatus.APROVADA
              : JustificationStatus.RECUSADA,
          reviewNote,
          reviewedById: user.id,
          reviewedAt: now,
        },
      });

      if (status === "APROVADA") {
        await tx.attendance.update({
          where: { id: existing.attendanceId },
          data: { status: AttendanceStatus.JUSTIFICADA },
        });
      }

      const dateBr = formatIsoDateBr(existing.attendance.lesson.date);
      const isApproved = status === "APROVADA";
      const notifTitle = isApproved
        ? `Justificativa Aprovada (FJ) - ${existing.student.name}`
        : `Justificativa Recusada - ${existing.student.name}`;
      const baseMsg = isApproved
        ? `Sua justificativa para a falta de ${existing.student.name} em ${dateBr} (${existing.attendance.lesson.lessonNumber}ª aula) foi aprovada e convertida para Falta Justificada (FJ).`
        : `Sua justificativa para a falta de ${existing.student.name} em ${dateBr} (${existing.attendance.lesson.lessonNumber}ª aula) não foi aceita pela coordenação.`;
      const notifMessage = reviewNote
        ? `${baseMsg} Parecer: ${reviewNote}`
        : baseMsg;

      const referenceKey = `JUST_${existing.id}_${status}`;
      await tx.notification.upsert({
        where: {
          recipientId_referenceKey: {
            recipientId: existing.guardianId,
            referenceKey,
          },
        },
        update: {
          title: notifTitle,
          message: notifMessage,
          acknowledgedAt: null,
        },
        create: {
          recipientId: existing.guardianId,
          studentId: existing.studentId,
          type: NotificationType.COMUNICADO,
          title: notifTitle,
          message: notifMessage,
          referenceKey,
        },
      });

      return record;
    });

    const pendingCount = await countPendingJustifications();

    await recordAuditLog({
      user,
      action:
        status === "APROVADA"
          ? "APROVAR_JUSTIFICATIVA"
          : "RECUSAR_JUSTIFICATIVA",
      entity: "AbsenceJustification",
      entityId: existing.id,
      details: `${status === "APROVADA" ? "Aprovou" : "Recusou"} justificativa de falta de ${existing.student.name} (${existing.attendance.lesson.date}, ${existing.attendance.lesson.lessonNumber}ª aula).`,
    });

    const justification: AbsenceJustificationItem = {
      id: updated.id,
      attendanceId: updated.attendanceId,
      studentId: updated.studentId,
      studentName: existing.student.name,
      studentRegistration: existing.student.registration,
      classroomName: existing.student.classroom.name,
      classroomSubject: existing.student.classroom.subject,
      lessonDate: existing.attendance.lesson.date,
      lessonNumber: existing.attendance.lesson.lessonNumber,
      guardianName: existing.guardian.name,
      guardianEmail: existing.guardian.email,
      reason: updated.reason,
      status: updated.status,
      reviewNote: updated.reviewNote,
      reviewedAt: updated.reviewedAt ? updated.reviewedAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    };

    return NextResponse.json(
      { justification, pendingCount },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[PATCH /api/justifications/[id]] Erro ao avaliar justificativa:", {
      operation: "justifications.review",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível avaliar a justificativa.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
