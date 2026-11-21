import { NotificationType } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { formatIsoDateBr } from "@/features/attendance/constants";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import {
  canManageClassrooms,
  type ApiErrorPayload,
} from "@/features/classrooms";
import {
  OCCURRENCE_SEVERITIES,
  OCCURRENCE_SEVERITY_LABELS,
  OCCURRENCE_STATUSES,
  OCCURRENCE_TYPE_LABELS,
  createOccurrenceSchema,
  listOccurrencesForUser,
  type OccurrenceItem,
  type OccurrenceSeverity,
  type OccurrenceStatus,
} from "@/features/occurrences";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function parseSeverity(value: string | null): OccurrenceSeverity | undefined {
  if (!value) return undefined;
  return (OCCURRENCE_SEVERITIES as readonly string[]).includes(value)
    ? (value as OccurrenceSeverity)
    : undefined;
}

function parseStatus(value: string | null): OccurrenceStatus | undefined {
  if (!value) return undefined;
  return (OCCURRENCE_STATUSES as readonly string[]).includes(value)
    ? (value as OccurrenceStatus)
    : undefined;
}

/**
 * GET /api/occurrences
 * Lista ocorrencias com filtros por classroomId, severity, status e busca por aluno.
 * PROFESSOR visualiza apenas suas turmas; ADMIN/COORDENACAO visualizam todas.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<{ occurrences: OccurrenceItem[] } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso restrito à equipe escolar.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const params = request.nextUrl.searchParams;
  const classroomId = params.get("classroomId")?.trim() || undefined;
  const severity = parseSeverity(params.get("severity"));
  const status = parseStatus(params.get("status"));
  const search = params.get("search")?.trim() || undefined;

  try {
    const occurrences = await listOccurrencesForUser(user, {
      classroomId,
      severity,
      status,
      search,
    });

    return NextResponse.json(
      { occurrences },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/occurrences] Erro ao listar ocorrencias:", {
      operation: "occurrences.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar as ocorrências.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * POST /api/occurrences
 * Registra nova ocorrencia usando o usuario autenticado como authorId e
 * dispara notificacao automatica para todos os responsaveis vinculados ao aluno.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ occurrence: OccurrenceItem } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso restrito à equipe escolar.", code: "FORBIDDEN" },
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

  const parsed = createOccurrenceSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados da ocorrência inválidos.";
    return NextResponse.json<ApiErrorPayload>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { classroomId, studentId, type, severity, date, description } = parsed.data;

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
          error: "Você não tem permissão para registrar ocorrências nesta turma.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        classroomId: classroom.id,
      },
      select: {
        id: true,
        guardianLinks: {
          select: { guardianId: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Aluno não encontrado na turma selecionada.",
          code: "VALIDATION_ERROR",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const record = await tx.occurrence.create({
        data: {
          classroomId: classroom.id,
          studentId: student.id,
          authorId: user.id,
          type,
          severity,
          date,
          description,
        },
        select: {
          id: true,
          studentId: true,
          classroomId: true,
          authorId: true,
          type: true,
          severity: true,
          description: true,
          status: true,
          resolutionNote: true,
          date: true,
          createdAt: true,
          student: {
            select: {
              id: true,
              name: true,
              registration: true,
              guardianPhone: true,
            },
          },
          classroom: {
            select: {
              id: true,
              name: true,
              subject: true,
              shift: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      const typeLabel = OCCURRENCE_TYPE_LABELS[record.type];
      const severityLabel = OCCURRENCE_SEVERITY_LABELS[record.severity];
      const title =
        record.type === "ELOGIO"
          ? `Elogio registrado - ${record.student.name}`
          : `${typeLabel} (${severityLabel}) - ${record.student.name}`;
      const message = `Registrado por ${record.author.name} em ${formatIsoDateBr(record.date)} (${record.classroom.name} - ${record.classroom.subject}): ${record.description}`;
      const referenceKey = `OCC_${record.id}`;

      for (const link of student.guardianLinks) {
        await tx.notification.upsert({
          where: {
            recipientId_referenceKey: {
              recipientId: link.guardianId,
              referenceKey,
            },
          },
          update: { title, message },
          create: {
            recipientId: link.guardianId,
            studentId: record.studentId,
            type: NotificationType.OCORRENCIA,
            title,
            message,
            referenceKey,
          },
        });
      }

      return record;
    });

    const occurrence: OccurrenceItem = {
      ...created,
      createdAt: created.createdAt.toISOString(),
      canDelete: true,
      familyReceipt: {
        status: student.guardianLinks.length > 0 ? "PENDING" : "NO_GUARDIAN",
        acknowledgedAt: null,
        acknowledgedByName: null,
      },
    };

    return NextResponse.json(
      { occurrence },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/occurrences] Erro ao registrar ocorrencia:", {
      operation: "occurrences.create",
      userId: user.id,
      classroomId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível registrar a ocorrência.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
