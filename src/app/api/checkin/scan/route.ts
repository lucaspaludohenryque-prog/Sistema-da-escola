import { NextResponse, type NextRequest } from "next/server";
import {
  AttendanceStatus,
  GateCheckInType,
  NotificationType,
  OccurrenceSeverity,
  OccurrenceStatus,
  OccurrenceType,
} from "@prisma/client";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms } from "@/features/classrooms/constants";
import type { ApiErrorPayload } from "@/features/classrooms";
import {
  GATE_CHECKIN_TYPE_LABELS,
  getSaoPauloDateTime,
  parseScannedCode,
} from "@/features/checkin/constants";
import type {
  GateCheckInRecord,
  ScanCheckInResponse,
} from "@/features/checkin/types";
import { scanCheckInSchema } from "@/features/checkin/validation";
import { recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const DUPLICATE_WINDOW_MS = 60_000;

/**
 * POST /api/checkin/scan
 * Registra Entrada, Atraso ou Saida via leitura de QR Code (RCO-CARD:<studentId>) ou matricula (CGM).
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ScanCheckInResponse | ApiErrorPayload>> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(currentUser.role)) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: "Apenas a equipe escolar pode registrar leituras na portaria.",
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

  const parsed = scanCheckInSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Dados da leitura inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { code, mode, notifyGuardian, markAttendance, lessonNumber, notes } =
    parsed.data;

  const decoded = parseScannedCode(code);
  if (!decoded) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: "Código QR ou matrícula (CGM) inválido.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const student = await prisma.student.findFirst({
      where:
        decoded.kind === "studentId"
          ? { id: decoded.value }
          : {
              OR: [
                { registration: { equals: decoded.value, mode: "insensitive" } },
                { id: decoded.value },
              ],
            },
      select: {
        id: true,
        name: true,
        registration: true,
        active: true,
        classroomId: true,
        classroom: {
          select: {
            id: true,
            name: true,
            subject: true,
            teacherId: true,
          },
        },
        guardianLinks: {
          select: {
            guardianId: true,
            guardian: { select: { active: true } },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: `Nenhum estudante encontrado para "${code}". Confira o QR Code ou a matrícula (CGM).`,
          code: "NOT_FOUND",
        },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (!student.active) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: `O cadastro de ${student.name} está inativo no sistema.`,
          code: "VALIDATION_ERROR",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const isManager = canManageClassrooms(currentUser.role);
    if (!isManager && student.classroom.teacherId !== currentUser.id) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: `${student.name} pertence à turma ${student.classroom.name} (${student.classroom.subject}), fora da sua atribuição docente.`,
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    // Protecao contra leitura duplicada acidental em menos de 60 segundos
    const duplicateCutoff = new Date(Date.now() - DUPLICATE_WINDOW_MS);
    const recentDuplicate = await prisma.gateCheckIn.findFirst({
      where: {
        studentId: student.id,
        type: mode as GateCheckInType,
        createdAt: { gte: duplicateCutoff },
      },
      select: {
        id: true,
        date: true,
        time: true,
        type: true,
        notes: true,
        createdAt: true,
        recordedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentDuplicate) {
      const checkIn: GateCheckInRecord = {
        id: recentDuplicate.id,
        studentId: student.id,
        studentName: student.name,
        registration: student.registration,
        classroomId: student.classroom.id,
        classroomName: student.classroom.name,
        classroomSubject: student.classroom.subject,
        date: recentDuplicate.date,
        time: recentDuplicate.time,
        type: recentDuplicate.type,
        notes: recentDuplicate.notes,
        recordedByName: recentDuplicate.recordedBy.name,
        createdAt: recentDuplicate.createdAt.toISOString(),
      };

      return NextResponse.json<ScanCheckInResponse>(
        {
          duplicate: true,
          message: `${GATE_CHECKIN_TYPE_LABELS[mode]} de ${student.name} já foi registrada às ${recentDuplicate.time} (menos de 1 minuto atrás).`,
          checkIn,
          guardianNotified: false,
          occurrenceCreated: false,
          attendanceMarked: false,
        },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }

    const { date, time } = getSaoPauloDateTime();
    const activeGuardianIds = Array.from(
      new Set(
        student.guardianLinks
          .filter((link) => link.guardian.active)
          .map((link) => link.guardianId)
      )
    );

    const txResult = await prisma.$transaction(async (tx) => {
      const createdCheckIn = await tx.gateCheckIn.create({
        data: {
          studentId: student.id,
          classroomId: student.classroom.id,
          recordedById: currentUser.id,
          date,
          time,
          type: mode as GateCheckInType,
          notes: notes?.trim() ? notes.trim() : null,
        },
        select: {
          id: true,
          date: true,
          time: true,
          type: true,
          notes: true,
          createdAt: true,
        },
      });

      let occurrenceCreated = false;
      let guardianNotified = false;
      let attendanceMarked = false;

      if (mode === "ATRASO") {
        await tx.occurrence.create({
          data: {
            studentId: student.id,
            classroomId: student.classroom.id,
            authorId: currentUser.id,
            type: OccurrenceType.ATRASO,
            severity: OccurrenceSeverity.LEVE,
            status: OccurrenceStatus.PENDENTE,
            date,
            description: `Chegada com atraso registrada via Carteirinha Digital às ${time}.`,
          },
        });
        occurrenceCreated = true;

        if (activeGuardianIds.length > 0) {
          await tx.notification.createMany({
            data: activeGuardianIds.map((guardianId) => ({
              recipientId: guardianId,
              studentId: student.id,
              type: NotificationType.OCORRENCIA,
              title: `Chegada com atraso — ${student.name}`,
              message: `Chegada com atraso registrada na portaria via Carteirinha Digital às ${time} (${student.classroom.name} - ${student.classroom.subject}).`,
              referenceKey: `gate-atraso-${createdCheckIn.id}`,
            })),
            skipDuplicates: true,
          });
          guardianNotified = true;
        }
      } else if (mode === "ENTRADA" && notifyGuardian) {
        if (activeGuardianIds.length > 0) {
          await tx.notification.createMany({
            data: activeGuardianIds.map((guardianId) => ({
              recipientId: guardianId,
              studentId: student.id,
              type: NotificationType.COMUNICADO,
              title: "Entrada confirmada na escola",
              message: `${student.name} chegou à escola às ${time} (${student.classroom.name} - ${student.classroom.subject}).`,
              referenceKey: `gate-entrada-${createdCheckIn.id}`,
            })),
            skipDuplicates: true,
          });
          guardianNotified = true;
        }
      }

      if (markAttendance && (mode === "ENTRADA" || mode === "ATRASO")) {
        const targetLesson = await tx.lesson.findFirst({
          where: {
            classroomId: student.classroom.id,
            date,
            ...(lessonNumber ? { lessonNumber } : {}),
          },
          select: { id: true },
          orderBy: { lessonNumber: "desc" },
        });

        if (targetLesson) {
          await tx.attendance.upsert({
            where: {
              lessonId_studentId: {
                lessonId: targetLesson.id,
                studentId: student.id,
              },
            },
            update: { status: AttendanceStatus.PRESENTE },
            create: {
              lessonId: targetLesson.id,
              studentId: student.id,
              status: AttendanceStatus.PRESENTE,
            },
          });
          attendanceMarked = true;
        }
      }

      return {
        createdCheckIn,
        occurrenceCreated,
        guardianNotified,
        attendanceMarked,
      };
    });

    await recordAuditLog({
      user: currentUser,
      action: "CHECKIN_PORTARIA",
      entity: "GateCheckIn",
      entityId: txResult.createdCheckIn.id,
      details: `Registrou ${GATE_CHECKIN_TYPE_LABELS[mode]} de ${student.name} (${student.classroom.name}) às ${time}${
        txResult.occurrenceCreated ? " com ocorrência de atraso" : ""
      }${txResult.guardianNotified ? " e aviso à família" : ""}.`,
    });

    const checkIn: GateCheckInRecord = {
      id: txResult.createdCheckIn.id,
      studentId: student.id,
      studentName: student.name,
      registration: student.registration,
      classroomId: student.classroom.id,
      classroomName: student.classroom.name,
      classroomSubject: student.classroom.subject,
      date: txResult.createdCheckIn.date,
      time: txResult.createdCheckIn.time,
      type: txResult.createdCheckIn.type,
      notes: txResult.createdCheckIn.notes,
      recordedByName: currentUser.name,
      createdAt: txResult.createdCheckIn.createdAt.toISOString(),
    };

    return NextResponse.json<ScanCheckInResponse>(
      {
        duplicate: false,
        message: `${GATE_CHECKIN_TYPE_LABELS[mode]} registrada para ${student.name} às ${time}.`,
        checkIn,
        guardianNotified: txResult.guardianNotified,
        occurrenceCreated: txResult.occurrenceCreated,
        attendanceMarked: txResult.attendanceMarked,
      },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/checkin/scan] Erro ao processar leitura QR:", {
      operation: "checkin.scan",
      userId: currentUser.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      {
        error: "Não foi possível registrar a leitura da carteirinha.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
